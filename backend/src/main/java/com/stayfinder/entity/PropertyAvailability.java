package com.stayfinder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "property_availability")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyAvailability {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "is_available", nullable = false)
    private boolean available = true;

    @Column(name = "custom_price", precision = 10, scale = 2)
    private BigDecimal customPrice;
}
