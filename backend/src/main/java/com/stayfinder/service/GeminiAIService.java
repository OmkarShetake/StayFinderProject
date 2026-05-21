package com.stayfinder.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiAIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.enabled:true}")
    private boolean enabled;

    private static final String GEMINI_API_URL = 
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Generate property description using AI
     */
    public String generatePropertyDescription(
            String propertyType,
            String city,
            String state,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities
    ) {
        if (!enabled) {
            log.debug("Gemini AI is disabled");
            return null;
        }

        String prompt = buildPropertyDescriptionPrompt(
            propertyType, city, state, bedrooms, bathrooms, maxGuests, amenities
        );

        return callGeminiAPI(prompt);
    }

    /**
     * Summarize reviews into one sentence
     */
    public String summarizeReviews(List<String> reviewTexts, double avgRating) {
        if (!enabled || reviewTexts.isEmpty()) {
            return null;
        }

        String prompt = buildReviewSummaryPrompt(reviewTexts, avgRating);
        return callGeminiAPI(prompt);
    }

    /**
     * Build prompt for property description
     */
    private String buildPropertyDescriptionPrompt(
            String propertyType,
            String city,
            String state,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities
    ) {
        String amenitiesList = amenities != null && !amenities.isEmpty() 
            ? String.join(", ", amenities) 
            : "basic amenities";

        return String.format("""
            Write a compelling, professional property description for a rental listing.
            
            Property Details:
            - Type: %s
            - Location: %s, %s
            - Bedrooms: %d
            - Bathrooms: %d
            - Max Guests: %d
            - Amenities: %s
            
            Requirements:
            - Write 3-4 sentences (80-120 words)
            - Be enthusiastic but professional
            - Highlight the location and key amenities
            - Make it appealing to travelers
            - Don't use markdown or special formatting
            - Don't include price or booking information
            
            Write only the description, nothing else.
            """,
            propertyType, city, state, bedrooms, bathrooms, maxGuests, amenitiesList
        );
    }

    /**
     * Build prompt for review summary
     */
    private String buildReviewSummaryPrompt(List<String> reviewTexts, double avgRating) {
        String allReviews = String.join("\n---\n", reviewTexts);
        
        return String.format("""
            Summarize these property reviews into ONE concise sentence (15-20 words).
            
            Average Rating: %.1f/5.0
            
            Reviews:
            %s
            
            Requirements:
            - ONE sentence only
            - Highlight the most common positive themes
            - Be specific (mention what guests loved: location, cleanliness, host, etc.)
            - Keep it natural and conversational
            - Don't use quotes or special formatting
            
            Example: "Guests loved the spotless rooms, central location, and the host's warm hospitality."
            
            Write only the summary sentence, nothing else.
            """,
            avgRating, allReviews
        );
    }

    /**
     * Call Gemini API
     */
    private String callGeminiAPI(String prompt) {
        try {
            String url = GEMINI_API_URL + "?key=" + apiKey;

            // Build request body
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 200,
                    "topP", 0.8,
                    "topK", 40
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
            );

            // Extract text from response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    
                    if (parts != null && !parts.isEmpty()) {
                        String text = (String) parts.get(0).get("text");
                        return text != null ? text.trim() : null;
                    }
                }
            }

            log.warn("Gemini API returned unexpected response format");
            return null;

        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage());
            return null;
        }
    }
}
