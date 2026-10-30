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
      # PM2 cluster: next's HTTP server runs IN the worker process, so N
      # workers share one listening socket on :3001 — thousands of
      # concurrent SSR views instead of queuing on a single Node loop.
      # (Forking `npm run start` cannot cluster: each worker spawns its
      # own child server and they fight over the port.)
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      out_file: "/var/log/modit-web-out.log",
      error_file: "/var/log/modit-web-err.log",
      merge_logs: true,
    },
  ],
};
