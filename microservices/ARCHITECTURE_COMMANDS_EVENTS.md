# 🏗️ Architecture Commands vs Events

## 📋 **Vue d'ensemble**

Cette architecture sépare clairement les **Commands** (ce qu'on veut faire) des **Events** (ce qui s'est passé) en utilisant des topics Kafka dédiés.

## 🎯 **Topics Kafka**

### **Topics Commands (ce qu'on veut faire)**
- `orders-commands` - Commandes liées aux commandes
- `payments-commands` - Commandes liées aux paiements
- `emails-commands` - Commandes liées aux emails
- `analytics-commands` - Commandes liées aux analytics

### **Topics Events (ce qui s'est passé)**
- `orders-events` - Événements liés aux commandes
- `payments-events` - Événements liés aux paiements
- `emails-events` - Événements liés aux emails
- `analytics-events` - Événements liés aux analytics

### **Topic Cross-Domain**
- `business-events` - Événements métier génériques

## 🔄 **Mapping Commands → Events**

### **Orders**
```typescript
// COMMANDS → orders-commands
'order.create'     → Créer une commande
'order.update'     → Modifier une commande
'order.confirm'    → Confirmer une commande
'order.cancel'     → Annuler une commande

// EVENTS → orders-events
'order.created'    → Commande créée
'order.updated'    → Commande modifiée
'order.confirmed'  → Commande confirmée
'order.cancelled'  → Commande annulée
'order.creation.failed' → Échec de création
```

### **Payments**
```typescript
// COMMANDS → payments-commands
'payment.process'  → Traiter un paiement
'payment.refund'   → Rembourser
'payment.capture'  → Capturer un paiement

// EVENTS → payments-events
'payment.started'  → Paiement commencé
'payment.completed' → Paiement terminé
'payment.failed'   → Paiement échoué
'payment.refunded' → Paiement remboursé
```

### **Emails**
```typescript
// COMMANDS → emails-commands
'email.send'       → Envoyer un email
'email.schedule'   → Programmer un email
'email.cancel'     → Annuler un email

// EVENTS → emails-events
'email.sent'       → Email envoyé
'email.failed'     → Email échoué
'email.delivered'  → Email livré
```

### **Analytics**
```typescript
// COMMANDS → analytics-commands
'analytics.collect' → Collecter des données
'analytics.export'  → Exporter des données

// EVENTS → analytics-events
'analytics.collected' → Données collectées
'analytics.exported'  → Données exportées
```

## 🚀 **Flux de la Saga**

```
1. API Gateway → 'order.create' → orders-commands
2. Order Service traite → 'order.created' → orders-events
3. API Gateway écoute → 'order.created' → 'payment.process' → payments-commands
4. Payment Service traite → 'payment.completed' → payments-events
5. API Gateway écoute → 'payment.completed' → 'order.confirm' → orders-commands
6. Order Service traite → 'order.confirmed' → orders-events
7. API Gateway écoute → 'order.confirmed' → 'email.send' → emails-commands
8. Email Service traite → 'email.sent' → emails-events
```

## 🔧 **Implémentation**

### **EventBus Mapping**
```typescript
private getTopicForEvent(eventType: EventType): string {
  // COMMANDS → Topics commands
  if (eventType.endsWith('.create') || eventType.endsWith('.process') || 
      eventType.endsWith('.send') || eventType.endsWith('.collect')) {
    
    if (eventType.startsWith('order.')) return 'orders-commands';
    if (eventType.startsWith('payment.')) return 'payments-commands';
    if (eventType.startsWith('email.')) return 'emails-commands';
    if (eventType.startsWith('analytics.')) return 'analytics-commands';
  }
  
  // EVENTS → Topics events
  if (eventType.startsWith('order.')) return 'orders-events';
  if (eventType.startsWith('payment.')) return 'payments-events';
  if (eventType.startsWith('email.')) return 'emails-events';
  if (eventType.startsWith('analytics.')) return 'analytics-events';
  
  return 'business-events';
}
```

## ✅ **Avantages**

1. **Séparation claire** : Commands vs Events
2. **Scalabilité** : Chaque type peut scaler indépendamment
3. **Monitoring** : Métriques claires par type
4. **Maintenance** : Logique métier séparée
5. **CQRS friendly** : Commands pour Write, Events pour Read
6. **Audit trail** : Traçabilité complète

## 🚨 **Points d'attention**

- Les microservices doivent être configurés pour écouter les bons topics
- La migration doit être progressive pour éviter les interruptions
- Les anciens topics peuvent être supprimés après migration complète 