package com.stayfinder.entity;

import lombok.*;
import java.io.Serializable;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class WishlistId implements Serializable {
    private Long user;
    private Long property;
}
