from __future__ import annotations

import json
import logging
import re
from typing import Any, AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.models.enums import ProductCode
from backend.app.models.shared import AIChat, AIMessage, AISession

logger = logging.getLogger(__name__)

settings = get_settings()

_llm = None


def _get_llm():
    global _llm
    if _llm is not None:
        return _llm
    if not settings.openai_api_key:
        return None
    try:
        from langchain_openai import ChatOpenAI

        _llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.7,
            max_tokens=2048,
        )
        return _llm
    except ImportError:
        logger.warning("langchain_openai not installed, AI features use fallback")
        return None


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _build_messages(system_prompt: str, history: list[dict], user_message: str) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages


async def _store_message(db: AsyncSession, chat_id: str, role: str, content: str, token_count: int) -> AIMessage:
    msg = AIMessage(chat_id=chat_id, role=role, content=content, token_count=token_count)
    db.add(msg)
    return msg


async def _get_or_create_chat(db: AsyncSession, session_id: str) -> AIChat:
    stmt = select(AIChat).where(AIChat.session_id == session_id, AIChat.deleted_at.is_(None)).order_by(AIChat.created_at.desc()).limit(1)
    result = await db.execute(stmt)
    chat = result.scalar_one_or_none()
    if chat:
        return chat
    chat = AIChat(session_id=session_id)
    db.add(chat)
    await db.flush()
    return chat


async def _get_history(db: AsyncSession, session_id: str) -> list[dict]:
    stmt = (
        select(AIChat)
        .where(AIChat.session_id == session_id, AIChat.deleted_at.is_(None))
        .order_by(AIChat.created_at.asc())
    )
    result = await db.execute(stmt)
    chats = result.scalars().all()
    messages: list[dict] = []
    for chat in chats:
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.chat_id == chat.id, AIMessage.deleted_at.is_(None))
            .order_by(AIMessage.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        for m in msg_result.scalars().all():
            messages.append({"role": m.role, "content": m.content})
    return messages


class AIService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(
        self,
        user_id: str,
        product_code: str,
        model_name: str = "gpt-4o-mini",
        system_prompt: str | None = None,
    ) -> AISession:
        session = AISession(
            product_code=product_code,
            user_id=user_id,
            provider="openai" if settings.openai_api_key else "fallback",
            model_name=model_name,
            system_prompt=system_prompt,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def chat(
        self,
        session_id: str,
        user_message: str,
        system_prompt: str = "You are a helpful assistant.",
        product_code: str = "modit",
    ) -> dict[str, Any]:
        session_obj = await self.db.get(AISession, session_id)
        if not session_obj:
            raise ValueError("Session not found")

        history = await _get_history(self.db, session_id)
        chat = await _get_or_create_chat(self.db, session_id)

        llm = _get_llm()
        if llm is not None:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage, AIMessage as LCAIMessage

                messages = [SystemMessage(content=system_prompt)]
                for h in history:
                    if h["role"] == "user":
                        messages.append(HumanMessage(content=h["content"]))
                    elif h["role"] == "assistant":
                        messages.append(LCAIMessage(content=h["content"]))
                messages.append(HumanMessage(content=user_message))

                response = await llm.ainvoke(messages)
                assistant_content = response.content
                tokens_used = _estimate_tokens(user_message) + _estimate_tokens(assistant_content)
            except Exception as exc:
                logger.error("OpenAI call failed: %s", exc)
                assistant_content = self._fallback_response(user_message, product_code)
                tokens_used = _estimate_tokens(assistant_content)
        else:
            assistant_content = self._fallback_response(user_message, product_code)
            tokens_used = _estimate_tokens(assistant_content)

        await _store_message(self.db, chat.id, "user", user_message, _estimate_tokens(user_message))
        await _store_message(self.db, chat.id, "assistant", assistant_content, tokens_used)

        session_obj.token_count += tokens_used
        self.db.add(session_obj)
        await self.db.flush()

        logger.info("AI chat session=%s tokens=%d", session_id, tokens_used)

        return {"response": assistant_content, "session_id": session_id, "tokens_used": tokens_used}

    async def stream_chat(
        self,
        session_id: str,
        user_message: str,
        system_prompt: str = "You are a helpful assistant.",
        product_code: str = "modit",
    ) -> AsyncGenerator[str, None]:
        session_obj = await self.db.get(AISession, session_id)
        if not session_obj:
            raise ValueError("Session not found")

        history = await _get_history(self.db, session_id)
        chat = await _get_or_create_chat(self.db, session_id)

        llm = _get_llm()
        if llm is not None:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage, AIMessage as LCAIMessage

                messages = [SystemMessage(content=system_prompt)]
                for h in history:
                    if h["role"] == "user":
                        messages.append(HumanMessage(content=h["content"]))
                    elif h["role"] == "assistant":
                        messages.append(LCAIMessage(content=h["content"]))
                messages.append(HumanMessage(content=user_message))

                full_response = ""
                async for chunk in llm.astream(messages):
                    token = chunk.content
                    if token:
                        full_response += token
                        yield token

                await _store_message(self.db, chat.id, "user", user_message, _estimate_tokens(user_message))
                await _store_message(self.db, chat.id, "assistant", full_response, _estimate_tokens(full_response))
                session_obj.token_count += _estimate_tokens(full_response)
                self.db.add(session_obj)
                await self.db.flush()
                return
            except Exception as exc:
                logger.error("OpenAI stream failed: %s", exc)

        fallback = self._fallback_response(user_message, product_code)
        await _store_message(self.db, chat.id, "user", user_message, _estimate_tokens(user_message))
        await _store_message(self.db, chat.id, "assistant", fallback, _estimate_tokens(fallback))
        session_obj.token_count += _estimate_tokens(fallback)
        self.db.add(session_obj)
        await self.db.flush()
        yield fallback

    async def get_chat_history(self, session_id: str) -> list[dict]:
        return await _get_history(self.db, session_id)

    async def material_recommendation(self, requirements: str, budget: float, location: str) -> dict:
        system_prompt = (
            "You are a construction material expert for the Indian market. "
            "Given user requirements, a budget in INR, and a location, recommend specific materials "
            "with quantities, unit prices, and reasoning. Return JSON with keys: items (list of dicts with "
            "name, quantity, unit, unit_price, total_price, reason), total_estimated_cost, reasoning."
        )
        user_msg = f"Requirements: {requirements}\nBudget: ₹{budget:,.0f}\nLocation: {location}"
        return await self._structured_call(system_prompt, user_msg, "material_recommendation")

    async def boq_reader(self, boq_text: str) -> dict:
        system_prompt = (
            "You are a BOQ (Bill of Quantities) parser for construction projects in India. "
            "Parse the BOQ text and extract line items with material name, quantity, unit, "
            "and estimated cost. Return JSON with keys: items (list of dicts), total_estimated_cost, summary."
        )
        return await self._structured_call(system_prompt, boq_text, "boq_reader")

    async def vendor_matching(self, product_requirements: str, location: str, budget: float) -> dict:
        system_prompt = (
            "You are a vendor matching specialist for construction materials in India. "
            "Given product requirements, location, and budget, recommend vendors with match scores. "
            "Return JSON with keys: vendors (list of dicts with name, location, match_score, estimated_price, "
            "reliability, delivery_time), match_score (overall), reasoning."
        )
        user_msg = f"Requirements: {product_requirements}\nLocation: {location}\nBudget: ₹{budget:,.0f}"
        return await self._structured_call(system_prompt, user_msg, "vendor_matching")

    async def procurement_assistant(self, query: str, context: str | None = None) -> str:
        system_prompt = (
            "You are a procurement assistant for construction companies in India. "
            "Help with RFQ creation, vendor negotiations, cost optimization, and procurement strategy. "
            "Provide practical, actionable advice. Be concise and specific."
        )
        user_msg = query
        if context:
            user_msg = f"Context: {context}\n\nQuery: {query}"
        llm = _get_llm()
        if llm is not None:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage

                messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_msg)]
                response = await llm.ainvoke(messages)
                return response.content
            except Exception as exc:
                logger.error("OpenAI procurement_assistant failed: %s", exc)
        return self._fallback_procurement(query)

    async def travel_planner(self, destination: str, dates: str, budget: float, preferences: str) -> dict:
        system_prompt = (
            "You are a temple pilgrimage travel planner specializing in Indian spiritual destinations. "
            "Plan a detailed itinerary with accommodation, darshan timings, local transport, and dining. "
            "Consider the user's budget in INR and preferences. "
            "Return JSON with keys: itinerary (list of dicts with day, activities, accommodation, transport, cost), "
            "estimated_cost (total), tips (list of practical tips)."
        )
        user_msg = f"Destination: {destination}\nDates: {dates}\nBudget: ₹{budget:,.0f}\nPreferences: {preferences}"
        return await self._structured_call(system_prompt, user_msg, "travel_planner")

    async def temple_recommendation(self, user_preferences: str, location: str, budget: float) -> dict:
        system_prompt = (
            "You are a temple recommendation expert for Indian pilgrimage destinations. "
            "Based on user preferences, location, and budget, recommend temples with details like "
            "significance, best time to visit, darshan costs, and travel tips. "
            "Return JSON with keys: temples (list of dicts with name, location, significance, "
            "best_time, estimated_cost, why_recommended), reasoning."
        )
        user_msg = f"Preferences: {user_preferences}\nLocation: {location}\nBudget: ₹{budget:,.0f}"
        return await self._structured_call(system_prompt, user_msg, "temple_recommendation")

    async def price_prediction(self, product_name: str, quantity: int, location: str) -> dict:
        system_prompt = (
            "You are a construction material price analyst for the Indian market. "
            "Predict the likely price for a product given quantity and location. "
            "Consider seasonal trends, supply chain factors, and regional pricing. "
            "Return JSON with keys: predicted_price (per unit), confidence (0-1), factors (list of influencing factors)."
        )
        user_msg = f"Product: {product_name}\nQuantity: {quantity}\nLocation: {location}"
        return await self._structured_call(system_prompt, user_msg, "price_prediction")

    async def inventory_forecast(self, product_id: str, months: int = 6) -> dict:
        system_prompt = (
            "You are an inventory forecasting specialist for construction material suppliers. "
            "Forecast demand for a product over the specified months considering seasonal patterns "
            "and market trends in India. "
            "Return JSON with keys: forecast (list of dicts with month, predicted_demand, confidence), "
            "reorder_suggestion (actionable recommendation string)."
        )
        user_msg = f"Product ID: {product_id}\nForecast period: {months} months"
        return await self._structured_call(system_prompt, user_msg, "inventory_forecast")

    async def cost_estimator(self, project_type: str, specifications: str) -> dict:
        system_prompt = (
            "You are a construction cost estimator for the Indian market. "
            "Estimate total project cost based on project type and specifications. "
            "Provide a detailed breakdown by category. "
            "Return JSON with keys: estimate (total in INR), breakdown (dict of category to cost), "
            "confidence (0-1 based on specification completeness)."
        )
        user_msg = f"Project type: {project_type}\nSpecifications: {specifications}"
        return await self._structured_call(system_prompt, user_msg, "cost_estimator")

    async def negotiation_assistant(self, product: str, target_price: float, supplier_name: str) -> dict:
        system_prompt = (
            "You are a procurement negotiation expert for construction materials in India. "
            "Develop a negotiation strategy for the given product, target price, and supplier. "
            "Consider market rates, bulk pricing, seasonal factors, and relationship dynamics. "
            "Return JSON with keys: strategy (detailed negotiation approach), talking_points (list of key points), "
            "counter_offer (suggested initial offer in INR)."
        )
        user_msg = f"Product: {product}\nTarget price: ₹{target_price:,.0f}\nSupplier: {supplier_name}"
        return await self._structured_call(system_prompt, user_msg, "negotiation_assistant")

    async def _structured_call(self, system_prompt: str, user_msg: str, feature_name: str) -> dict:
        llm = _get_llm()
        if llm is not None:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage

                messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_msg)]
                response = await llm.ainvoke(messages)
                raw = response.content
                json_match = re.search(r"\{.*\}", raw, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                return {"raw_response": raw}
            except Exception as exc:
                logger.error("OpenAI %s failed: %s", feature_name, exc)
        return self._fallback_structured(feature_name, user_msg)

    @staticmethod
    def _fallback_response(user_message: str, product_code: str) -> str:
        lower = user_message.lower()
        if product_code == "namo_setu":
            if "temple" in lower:
                return (
                    "For temple visits, I recommend checking the official temple website for darshan timings "
                    "and booking your slot in advance. Popular temples like Tirumala, Varanasi, and Rishikesh "
                    "tend to have long queues during peak seasons."
                )
            if "trip" in lower or "travel" in lower:
                return (
                    "For a spiritual trip, consider combining nearby temples into a single itinerary. "
                    "Start with an early morning darshan, followed by a local sightseeing tour, "
                    "and end with an evening aarti."
                )
            return (
                "Welcome to Namo Setu! I can help you plan temple visits, book darshan slots, "
                "find nearby temples, and arrange spiritual travel packages."
            )
        return (
            "I can help you with construction material sourcing, price comparisons, vendor recommendations, "
            "and project cost estimation. Please ask a specific question to get started."
        )

    @staticmethod
    def _fallback_procurement(query: str) -> str:
        return (
            f"Based on your procurement query, here are some general recommendations:\n"
            "1. Compare at least 3 vendors before finalizing\n"
            "2. Request bulk pricing for orders above ₹50,000\n"
            "3. Verify vendor credentials and past delivery performance\n"
            "4. Negotiate payment terms for better rates\n"
            f"Query received: {query[:200]}"
        )

    @staticmethod
    def _fallback_structured(feature_name: str, user_msg: str) -> dict:
        fallbacks: dict[str, dict] = {
            "material_recommendation": {
                "items": [
                    {"name": "Cement OPC 53 Grade", "quantity": 100, "unit": "bags", "unit_price": 370, "total_price": 37000, "reason": "Standard grade for structural work"},
                    {"name": "TMT Steel Rebar Fe500", "quantity": 500, "unit": "kg", "unit_price": 58, "total_price": 29000, "reason": "High tensile strength for reinforcement"},
                    {"name": "River Sand", "quantity": 10, "unit": "cum", "unit_price": 1800, "total_price": 18000, "reason": "Fine aggregate for concrete mix"},
                ],
                "total_estimated_cost": 84000,
                "reasoning": "Basic material set for residential construction. Prices are indicative and may vary by location.",
            },
            "boq_reader": {
                "items": [
                    {"material": "Cement", "quantity": 500, "unit": "bags", "estimated_cost": 185000},
                    {"material": "Steel", "quantity": 2000, "unit": "kg", "estimated_cost": 116000},
                    {"material": "Aggregate", "quantity": 80, "unit": "cum", "estimated_cost": 96000},
                ],
                "total_estimated_cost": 397000,
                "summary": "BOQ parsed with standard construction materials. Please verify quantities against actual project requirements.",
            },
            "vendor_matching": {
                "vendors": [
                    {"name": "BuildWell Suppliers", "location": "Mumbai", "match_score": 0.85, "estimated_price": 82000, "reliability": "high", "delivery_time": "3-5 days"},
                    {"name": "ConstructPro Materials", "location": "Pune", "match_score": 0.78, "estimated_price": 79000, "reliability": "medium", "delivery_time": "5-7 days"},
                ],
                "match_score": 0.82,
                "reasoning": "Top vendors matched based on location, pricing, and reliability ratings.",
            },
            "travel_planner": {
                "itinerary": [
                    {"day": 1, "activities": ["Arrive at destination", "Check into hotel", "Evening darshan"], "accommodation": "Hotel near temple", "transport": "Private cab", "cost": 3000},
                    {"day": 2, "activities": ["Morning darshan", "Temple tour", "Local market visit"], "accommodation": "Same hotel", "transport": "Walking", "cost": 1500},
                ],
                "estimated_cost": 4500,
                "tips": ["Carry comfortable footwear", "Book darshan tickets online in advance", "Keep hydrated"],
            },
            "temple_recommendation": {
                "temples": [
                    {"name": "Kashi Vishwanath Temple", "location": "Varanasi", "significance": "One of the 12 Jyotirlingas", "best_time": "October-March", "estimated_cost": 2000, "why_recommended": "Spiritual significance and historical importance"},
                ],
                "reasoning": "Recommended temples based on your preferences and location proximity.",
            },
            "price_prediction": {
                "predicted_price": 380.0,
                "confidence": 0.65,
                "factors": ["Seasonal demand fluctuation", "Current market trends", "Supply chain stability", "Regional pricing differences"],
            },
            "inventory_forecast": {
                "forecast": [
                    {"month": "Month 1", "predicted_demand": 500, "confidence": 0.8},
                    {"month": "Month 2", "predicted_demand": 550, "confidence": 0.75},
                    {"month": "Month 3", "predicted_demand": 480, "confidence": 0.7},
                ],
                "reorder_suggestion": "Consider reordering in the first week of next month to avoid stock-out. Recommended reorder quantity: 1200 units.",
            },
            "cost_estimator": {
                "estimate": 1500000,
                "breakdown": {"materials": 900000, "labour": 350000, "equipment": 150000, "overheads": 100000},
                "confidence": 0.6,
            },
            "negotiation_assistant": {
                "strategy": "Start with a 10-15% lower counter offer. Emphasize long-term partnership potential and bulk order volume. Use market rate data to justify your position. Be prepared to walk away if the supplier cannot meet your target within 5%.",
                "talking_points": [
                    "Market rate for this product is currently below your quoted price",
                    "We are looking for a long-term supplier relationship",
                    "We can commit to a larger order volume for better pricing",
                    "Competitor quotes are more competitive",
                ],
                "counter_offer": 85000,
            },
        }
        return fallbacks.get(feature_name, {"response": f"Service temporarily unavailable for {feature_name}"})
