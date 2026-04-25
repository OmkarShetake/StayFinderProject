package com.stayfinder.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(1)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        long   startTime = System.currentTimeMillis();

        MDC.put("requestId", requestId);
        MDC.put("method",    req.getMethod());
        MDC.put("path",      req.getRequestURI());

        // Add request ID to response header for tracing
        res.setHeader("X-Request-Id", requestId);

        try {
            chain.doFilter(req, res);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            MDC.put("status",   String.valueOf(res.getStatus()));
            MDC.put("duration", duration + "ms");

            // Log only API requests, skip static resources
            if (req.getRequestURI().startsWith("/api/") || req.getRequestURI().startsWith("/ws")) {
                log.info("{} {} → {} ({}ms) [{}]",
                        req.getMethod(),
                        req.getRequestURI(),
                        res.getStatus(),
                        duration,
                        requestId);
            }
            MDC.clear();
        }
    }
}
