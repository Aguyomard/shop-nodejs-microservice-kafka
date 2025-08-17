<template>
  <div class="clothing-pay">
    <div class="pay-content">
      <div class="cart-total">
        <div class="total-row">
          <h1 class="total-label">CART TOTAL</h1>
          <h2 class="total-amount">${{ total.toFixed(2) }}</h2>
        </div>
        <p class="shipping-info">Shipping & taxes calculated at checkout</p>
      </div>

      <div class="terms-checkbox">
        <input
          type="checkbox"
          id="clothing-terms"
          class="checkbox"
          v-model="termsAccepted"
        />
        <label for="clothing-terms">
          I agree to the
          <span class="terms-link">Terms and Conditions</span>
        </label>
      </div>

      <div class="saved-card">
        <span class="card-label">Saved Card:</span>
        <div class="card-visual">
          <span class="card-icon">💳</span>
          <span class="card-number">**** 3567</span>
        </div>
        <span class="change-link">(change)</span>
      </div>

      <button
        :disabled="isPending || !termsAccepted"
        class="checkout-btn"
        @click="handleCheckout"
      >
        <span class="btn-text">CHECKOUT</span>
        <span v-if="isPending" class="spinner">⏳</span>
        <span v-else class="cart-icon">🛒</span>
      </button>

      <div v-if="checkoutResult" class="result-message">
        <span class="success-icon">✅</span>
        <span>
          Successful in
          <span
            class="duration"
            :class="{
              slow: checkoutResult.duration > 5,
              fast: checkoutResult.duration <= 5,
            }"
          >
            {{ checkoutResult.duration.toFixed(2) }}
          </span>
          seconds
        </span>
      </div>

      <div v-if="error" class="error-message">❌ Something went wrong!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface ClothingProduct {
  id: number;
  name: string;
  price: number;
  icon: string;
  description: string;
}

interface CheckoutResult {
  duration: number;
}

interface Props {
  products: ClothingProduct[];
}

const props = defineProps<Props>();

const termsAccepted = ref(true);
const isPending = ref(false);
const checkoutResult = ref<CheckoutResult | null>(null);
const error = ref<string | null>(null);

const total = computed(() => {
  return props.products.reduce((acc, product) => acc + product.price, 0);
});

const handleCheckout = async () => {
  if (!termsAccepted.value) return;

  isPending.value = true;
  error.value = null;
  checkoutResult.value = null;

  const startTime = Date.now();

  try {
    // Appel à l'endpoint /order de l'API Gateway
    const response = await fetch('http://localhost:3005/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart: props.products,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    checkoutResult.value = { duration };

    // Auto-hide success message after 8 seconds
    setTimeout(() => {
      checkoutResult.value = null;
    }, 8000);
  } catch (err) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    error.value = 'Checkout failed';
    console.error('Erreur lors du checkout:', err);

    // Auto-hide error message after 5 seconds
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isPending.value = false;
  }
};
</script>

<style scoped>
.clothing-pay {
  background: #fef2f2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  border-radius: 0.75rem;
}

.pay-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.cart-total {
  text-align: center;
}

.total-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.total-label {
  font-weight: 300;
  letter-spacing: 0.05em;
  font-size: 1.125rem;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.shipping-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.terms-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.checkbox {
  width: 1rem;
  height: 1rem;
}

.terms-link {
  color: #fca5a5;
  cursor: pointer;
}

.saved-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.card-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.card-visual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-icon {
  font-size: 1.5rem;
}

.card-number {
  font-weight: 600;
  font-size: 0.75rem;
}

.change-link {
  font-size: 0.75rem;
  color: #fca5a5;
  cursor: pointer;
}

.checkout-btn {
  background: #000;
  color: white;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: max-content;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.checkout-btn:hover:not(:disabled) {
  background: #374151;
  transform: translateY(-2px);
}

.checkout-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-text {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.spinner {
  animation: spin 1s linear infinite;
}

.cart-icon {
  font-size: 1rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.result-message {
  color: #059669;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.success-icon {
  font-size: 1.25rem;
}

.duration {
  font-weight: 700;
}

.duration.fast {
  color: #059669;
}

.duration.slow {
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 768px) {
  .clothing-pay {
    padding: 1.5rem;
  }

  .pay-content {
    gap: 2rem;
  }

  .total-row {
    flex-direction: column;
    gap: 1rem;
  }

  .checkout-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
