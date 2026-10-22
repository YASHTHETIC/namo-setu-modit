// PM2 process map for MODIT on the VPS (used by deploy/setup.sh).
module.exports = {
  apps: [
    {
      name: "modit-api",
      cwd: "/opt/modit",
      script: ".venv/bin/uvicorn",
      // --proxy-headers: honor X-Forwarded-For from nginx only (forwarded-allow-ips),
      // so per-IP rate limiting and audit logs see real client IPs, not 127.0.0.1.
      args: "backend.app.main:app --workers 2 --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips 127.0.0.1,::1",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      out_file: "/var/log/modit-api-out.log",
      error_file: "/var/log/modit-api-err.log",
      merge_logs: true,
    },
    {
      name: "modit-web",
      cwd: "/opt/modit/apps/modit/web",
      script: "npm",
      args: "run start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      out_file: "/var/log/modit-web-out.log",
      error_file: "/var/log/modit-web-err.log",
      merge_logs: true,
    },
  ],
};
