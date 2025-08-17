<template>
  <div class="clothing-shop">
    <h1 class="page-title">Clothing Collection</h1>

    <div class="content-layout">
      <!-- Left side - Clothing Products -->
      <div class="products-section">
        <div
          v-for="product in clothingProducts"
          :key="product.id"
          class="product-item"
        >
          <div class="product-image">
            <span class="product-icon">{{ product.icon }}</span>
          </div>
          <div class="product-details">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-footer">
              <h2 class="product-price">${{ product.price.toFixed(2) }}</h2>
              <div class="remove-btn">
                <span class="remove-icon">−</span>
                <span class="remove-text">Remove</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Clothing Pay Component -->
      <div class="pay-section">
        <ClothingPay :products="clothingProducts" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ClothingPay from '../components/ClothingPay.vue';

interface ClothingProduct {
  id: number;
  name: string;
  price: number;
  icon: string;
  description: string;
}

const clothingProducts: ClothingProduct[] = [
  {
    id: 1,
    name: 'Nike Air Max',
    price: 129.99,
    icon: '👟',
    description:
      'Premium running shoes with advanced cushioning technology. Perfect for both casual wear and athletic performance. Available in multiple colors.',
  },
  {
    id: 2,
    name: 'Adidas Superstar Cap',
    price: 29.99,
    icon: '🧢',
    description:
      'Classic baseball cap with embroidered logo. Made from breathable cotton with adjustable strap. Perfect for sunny days and casual outfits.',
  },
  {
    id: 3,
    name: 'Puma Yellow T-Shirt',
    price: 49.99,
    icon: '👕',
    description:
      'Vibrant yellow cotton t-shirt with Puma branding. Soft, breathable fabric perfect for everyday wear. Available in sizes S-XXL.',
  },
  {
    id: 4,
    name: "Levi's 501 Jeans",
    price: 89.99,
    icon: '👖',
    description:
      'Classic straight-leg jeans in authentic denim. Iconic 501 fit with button fly and five-pocket styling. Durable and comfortable for daily wear.',
  },
  {
    id: 5,
    name: 'North Face Jacket',
    price: 199.99,
    icon: '🧥',
    description:
      'Waterproof winter jacket with thermal insulation. Features adjustable hood, multiple pockets, and breathable fabric technology for outdoor adventures.',
  },
];
</script>

<style scoped>
.clothing-shop {
  margin-bottom: 4rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4rem;
}

.content-layout {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.products-section {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  width: 100%;
}

.product-item {
  display: flex;
  gap: 1rem;
}

.product-image {
  width: 300px;
  height: 200px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 700;
}

.product-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.product-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #fee2e2;
  border-radius: 6px;
  padding: 0.25rem;
  cursor: pointer;
}

.remove-icon {
  font-size: 0.5rem;
  color: #fca5a5;
}

.remove-text {
  font-size: 0.625rem;
  color: #fca5a5;
}

.pay-section {
  width: 100%;
}

@media (min-width: 1024px) {
  .content-layout {
    flex-direction: row;
    justify-content: space-between;
  }

  .products-section {
    width: 66.666667%;
  }

  .pay-section {
    width: 33.333333%;
  }
}
</style>
