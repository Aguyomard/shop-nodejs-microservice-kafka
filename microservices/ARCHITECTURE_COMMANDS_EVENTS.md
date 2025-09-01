# 🏗️ Architecture Commands vs Events + Error Handling

## 📋 **Vue d'ensemble**

Cette architecture sépare clairement les **Commands** (ce qu'on veut faire) des **Events** (ce qui s'est passé) en utilisant des topics Kafka dédiés, avec une gestion d'erreurs robuste et un monitoring avancé.

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

### **Topics de Gestion d'Erreurs (Architecture Classique)**
- `error-events` - Événements d'erreur et incidents
- `dead-letter-queue` - Messages non traitables
- `monitoring-events` - Métriques et observabilité

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

### **Error Handling & Monitoring**
```typescript
// ERROR EVENTS → error-events
'error.retry_exhausted'        → Retry épuisé
'error.circuit_breaker_open'   → Circuit breaker ouvert
'error.timeout'                → Timeout détecté
'error.validation_failed'      → Échec de validation
'error.business_rule_violation' → Violation de règle métier
'error.infrastructure_failure' → Défaillance d'infrastructure
'error.dead_letter_queued'     → Message en DLQ
'error.manual_intervention_required' → Intervention manuelle requise

// MONITORING EVENTS → monitoring-events
'monitoring.failure'                    → Échec détecté
'monitoring.retry_attempt'              → Tentative de retry
'monitoring.circuit_breaker_state_change' → Changement d'état CB
'monitoring.service_health_check'       → Vérification de santé
'monitoring.performance_metrics'        → Métriques de performance
```

## 🚀 **Flux de la Saga avec Retry Pattern**

```
1. API Gateway → 'order.create' → orders-commands
   └─ Retry Pattern (3 tentatives, backoff exponentiel)
   
2. Order Service traite → 'order.created' → orders-events
   └─ Analytics: 'order.create.requested' → analytics-commands
   
3. API Gateway écoute → 'order.created' → 'payment.process' → payments-commands
   └─ Retry Pattern (3 tentatives, backoff exponentiel)
   
4. Payment Service traite → 'payment.completed' → payments-events
   └─ Analytics: 'payment.completed' → analytics-commands
   
5. API Gateway écoute → 'payment.completed' → 'order.confirm' → orders-commands
   └─ Retry Pattern (3 tentatives, backoff exponentiel)
   
6. Order Service traite → 'order.confirmed' → orders-events
   └─ Analytics: 'order.confirm.requested' → analytics-commands
   
7. API Gateway écoute → 'order.confirmed' → 'email.send' → emails-commands
   └─ Retry Pattern (3 tentatives, backoff exponentiel)
   
8. Email Service traite → 'email.sent' → emails-events
```

## 🛡️ **Gestion d'Erreurs Robuste**

### **Retry Pattern**
```typescript
export class RetryPattern {
  constructor(
    private readonly maxRetries = 3,        // Nombre max de tentatives
    private readonly baseDelay = 1000,      // Délai de base en ms
    private readonly maxDelay = 10000       // Délai maximum en ms
  ) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<T> {
    // Logique de retry avec backoff exponentiel
  }
}
```

### **Classification des Erreurs par Sévérité**
```typescript
private determineErrorSeverity(error: Error): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (error.message.includes('timeout') || error.message.includes('connection')) {
    return 'MEDIUM'; // Erreurs temporaires
  }
  
  if (error.message.includes('validation') || error.message.includes('business rule')) {
    return 'LOW'; // Erreurs de validation
  }
  
  if (error.message.includes('infrastructure') || error.message.includes('database')) {
    return 'HIGH'; // Erreurs d'infrastructure
  }
  
  if (error.message.includes('compensation') || error.message.includes('saga')) {
    return 'CRITICAL'; // Erreurs critiques de la saga
  }
  
  return 'MEDIUM'; // Par défaut
}
```

### **Compensation et Escalation**
```typescript
// En cas d'échec de paiement
await this.retryPattern.executeWithRetry(
  () => this.compensateOrder(paymentData),
  'Order Compensation'
);

// Escalation vers intervention manuelle
await this.escalateToManualIntervention(data, compensationError);
```

## 📊 **Monitoring et Observabilité**

### **Service de Monitoring**
```typescript
export class MonitoringService {
  constructor(private eventBus: IEventBus) {
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    // S'abonner aux événements de monitoring
    this.eventBus.subscribe('monitoring.failure', this.handleFailure.bind(this));
    this.eventBus.subscribe('error.manual_intervention_required', this.handleManualInterventionRequired.bind(this));
    // ... autres événements
  }
}
```

### **Métriques et Alertes**
- **Alertes Critiques** : Intervention immédiate requise
- **Alertes Haute Priorité** : Attention requise
- **Alertes Moyenne Priorité** : Surveiller de près
- **Logs Faible Priorité** : Révision périodique

## 🔧 **Implémentation**

### **EventBus Mapping Intelligent**
```typescript
private getTopicForEvent(eventType: EventType): string {
  // ERROR EVENTS → Topics d'erreurs spécialisés (Architecture Classique)
  if (eventType.startsWith('error.')) {
    return 'error-events';
  }
  
  // MONITORING EVENTS → Topics de monitoring et observabilité
  if (eventType.startsWith('monitoring.')) {
    return 'monitoring-events';
  }
  
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

## ✅ **Avantages de l'Architecture Complète**

1. **Séparation claire** : Commands vs Events
2. **Scalabilité** : Chaque type peut scaler indépendamment
3. **Monitoring avancé** : Métriques et alertes en temps réel
4. **Gestion d'erreurs robuste** : Retry + Compensation + Escalation
5. **Observabilité complète** : Traçabilité de bout en bout
6. **CQRS friendly** : Commands pour Write, Events pour Read
7. **Audit trail** : Historique complet des opérations
8. **Résilience** : Retry automatique avec backoff exponentiel
9. **Maintenance** : Logique métier séparée et organisée
10. **Production-ready** : Architecture classique et éprouvée

## 🚨 **Points d'attention**

- Les microservices doivent être configurés pour écouter les bons topics
- La migration doit être progressive pour éviter les interruptions
- Les anciens topics peuvent être supprimés après migration complète
- Le service de monitoring doit être actif pour la gestion d'erreurs
- Les alertes doivent être configurées selon les besoins métier

## 🔮 **Évolutions Futures**

- **Circuit Breaker Pattern** : Protection contre les services défaillants
- **Timeout Management** : Gestion des délais d'exécution
- **Fallback Strategies** : Plans B en cas d'échec
- **Distributed Tracing** : Traçabilité cross-services
- **Metrics Dashboard** : Interface de monitoring centralisée 