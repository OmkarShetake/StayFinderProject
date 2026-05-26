package com.stayfinder.scheduler;

import com.stayfinder.entity.Property;
import com.stayfinder.entity.Review;
import com.stayfinder.repository.PropertyRepository;
import com.stayfinder.repository.ReviewRepository;
import com.stayfinder.service.GeminiAIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewSummaryScheduler {

    private final PropertyRepository propertyRepository;
    private final ReviewRepository reviewRepository;
    private final GeminiAIService geminiAIService;

    /**
     * Generate AI summaries for properties with reviews
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void generateReviewSummaries() {
        log.info("Starting review summary generation...");

        // Find properties with reviews but no summary
        List<Property> properties = propertyRepository.findAll().stream()
                .filter(p -> p.getTotalReviews() >= 1 && p.getReviewSummary() == null)
                .toList();

        log.info("Found {} properties needing review summaries", properties.size());

        int successCount = 0;
        for (Property property : properties) {
            try {
                String summary = generateSummaryForProperty(property);
                if (summary != null) {
                    property.setReviewSummary(summary);
                    propertyRepository.save(property);
                    successCount++;
                    log.info("Generated summary for property: {}", property.getTitle());
                }
            } catch (Exception e) {
                log.error("Failed to generate summary for property {}: {}", 
                    property.getId(), e.getMessage());
            }
        }

        log.info("Review summary generation completed. Success: {}/{}", successCount, properties.size());
    }

    /**
     * Generate summary for a specific property
     */
    private String generateSummaryForProperty(Property property) {
        // Get all reviews for the property (limit to 50 most recent)
        Page<Review> reviewPage = reviewRepository.findByPropertyIdOrderByCreatedAtDesc(
            property.getId(), 
            PageRequest.of(0, 50)
        );
        
        List<Review> reviews = reviewPage.getContent();
        
        if (reviews.isEmpty()) {
            return null;
        }

        List<String> reviewTexts = reviews.stream()
                .map(Review::getComment)
                .filter(comment -> comment != null && !comment.isBlank())
                .collect(Collectors.toList());

        if (reviewTexts.isEmpty()) {
            return null;
        }

        return geminiAIService.summarizeReviews(reviewTexts, property.getAvgRating().doubleValue());
    }
}
