package com.stayfinder.repository;

import com.stayfinder.entity.Wishlist;
import com.stayfinder.entity.WishlistId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {
    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    @Modifying
    @Query("DELETE FROM Wishlist w WHERE w.user.id = :userId AND w.property.id = :propertyId")
    void deleteByUserIdAndPropertyId(@Param("userId") Long userId, @Param("propertyId") Long propertyId);
}
