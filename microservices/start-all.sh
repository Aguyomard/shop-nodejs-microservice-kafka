#!/bin/bash

echo "🚀 Démarrage de l'architecture microservices..."

# Démarrer Kafka
echo "📦 Démarrage de Kafka..."
cd kafka
docker-compose up -d
cd ..

# Attendre que Kafka soit prêt
echo "⏳ Attente que Kafka soit prêt..."
sleep 10

# Installer les dépendances si nécessaire
echo "📦 Installation des dépendances..."
for service in api-gateway payment-service order-service email-service analytic-service; do
    echo "Installing $service..."
    cd $service
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ..
done

echo "✅ Tous les services sont prêts !"
echo ""
echo "📋 Pour démarrer les services, ouvrez 5 terminaux et exécutez :"
echo ""
echo "Terminal 1 - API Gateway:"
echo "  cd microservices/api-gateway && npm run dev"
echo ""
echo "Terminal 2 - Payment Service:"
echo "  cd microservices/payment-service && npm run dev"
echo ""
echo "Terminal 3 - Order Service:"
echo "  cd microservices/order-service && npm run dev"
echo ""
echo "Terminal 4 - Email Service:"
echo "  cd microservices/email-service && npm run dev"
echo ""
echo "Terminal 5 - Analytics Service:"
echo "  cd microservices/analytic-service && npm run dev"
echo ""
echo "🌐 Kafka UI: http://localhost:8081"
echo "🔌 API Gateway: http://localhost:3005" 