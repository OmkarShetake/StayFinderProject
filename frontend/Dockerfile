# ── Serve frontend with nginx ─────────────────────────────────────
FROM nginx:alpine

# Copy all frontend files
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
