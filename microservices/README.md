# Architecture Microservices avec Kafka

Cette architecture remplace le serveur monolithique par des microservices communicant via Kafka.

## Structure des Services

```
microservices/
├── api-gateway/          # Porte d'entrée (port 3005)
├── payment-service/      # Service de paiement (port 3001)
├── order-service/        # Service de commande (port 3002)
├── email-service/        # Service d'email (port 3003)
├── analytic-service/     # Service d'analytics (port 3004)
└── kafka/               # Infrastructure Kafka
```

## Topics Kafka

- `payments` - Messages de paiement
- `orders` - Messages de commande
- `emails` - Messages d'email
- `analytics` - Messages d'analytics

## Démarrage

### 1. Démarrer Kafka
```bash
cd microservices/kafka
docker-compose up -d
```

### 2. Installer les dépendances
```bash
cd microservices/api-gateway && npm install
cd ../payment-service && npm install
cd ../order-service && npm install
cd ../email-service && npm install
cd ../analytic-service && npm install
```

### 3. Démarrer les services
```bash
# Terminal 1 - API Gateway
cd microservices/api-gateway && npm run dev

# Terminal 2 - Payment Service
cd microservices/payment-service && npm run dev

# Terminal 3 - Order Service
cd microservices/order-service && npm run dev

# Terminal 4 - Email Service
cd microservices/email-service && npm run dev

# Terminal 5 - Analytics Service
cd microservices/analytic-service && npm run dev
```

### 4. Tester
- Frontend: http://localhost:3005 (via API Gateway)
- Kafka UI: http://localhost:8081
- Health checks:
  - API Gateway: http://localhost:3005/health
  - Payment: http://localhost:3001/health
  - Order: http://localhost:3002/health
  - Email: http://localhost:3003/health
  - Analytics: http://localhost:3004/health

## Flux de Données

1. **Frontend** → **API Gateway** (POST /order)
2. **API Gateway** → **Kafka Topics** (payments, orders, emails)
3. **Microservices** consomment les messages et traitent
4. **Analytics** reçoit tous les événements

## Avantages

- **Découplage** : Services indépendants
- **Scalabilité** : Chaque service peut être mis à l'échelle séparément
- **Résilience** : Un service défaillant n'affecte pas les autres
- **Technologies** : Possibilité d'utiliser différentes technologies par service 















➜  dev-perso cd microservices/api-gateway && npm run dev
➜  dev-perso cd microservices/payment-service && npm run dev
➜  dev-perso cd microservices/order-service && npm run dev
➜  dev-perso cd microservices/email-service && npm run dev
➜  dev-perso cd microservices/analytic-service && npm run dev
➜  monolithe git:(main) docker compose up -d
cd microservices/kafka
docker-compose up -d




lsof -ti:3001, 3002, 3003, 3004, 3005
kill -9 42741 42758 42775 42803


lsof -ti:3005
kill -9 62618

faire des hexa 
Saga Pattern 





