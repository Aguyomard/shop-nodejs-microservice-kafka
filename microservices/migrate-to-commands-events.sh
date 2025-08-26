#!/bin/bash

echo "🚀 Migration vers l'architecture Commands vs Events"
echo "=================================================="

# Arrêter tous les services
echo "🛑 Arrêt des services existants..."
cd /home/alec/Bureau/dev-perso/microservices

# Arrêter les services (si ils tournent)
pkill -f "node.*api-gateway" || true
pkill -f "node.*order-service" || true
pkill -f "node.*payment-service" || true
pkill -f "node.*email-service" || true
pkill -f "node.*analytic-service" || true

echo "⏳ Attente de l'arrêt des services..."
sleep 3

# Redémarrer Kafka avec les nouveaux topics
echo "🔄 Redémarrage de Kafka avec les nouveaux topics..."
cd kafka
docker-compose down
docker-compose up -d

echo "⏳ Attente du démarrage de Kafka..."
sleep 10

# Créer les nouveaux topics
echo "📋 Création des nouveaux topics..."
node admin.js

echo "⏳ Attente de la création des topics..."
sleep 5

# Redémarrer tous les services
echo "🚀 Redémarrage des services avec la nouvelle architecture..."

# API Gateway
echo "📡 Démarrage API Gateway..."
cd ../api-gateway
npm run dev &
sleep 3

# Order Service
echo "📦 Démarrage Order Service..."
cd ../order-service
npm run dev &
sleep 3

# Payment Service
echo "💳 Démarrage Payment Service..."
cd ../payment-service
npm run dev &
sleep 3

# Email Service
echo "📧 Démarrage Email Service..."
cd ../email-service
npm run dev &
sleep 3

# Analytics Service
echo "📊 Démarrage Analytics Service..."
cd ../analytic-service
npm run dev &
sleep 3

echo "✅ Migration terminée !"
echo ""
echo "🎯 Nouveaux topics créés :"
echo "  - orders-commands"
echo "  - orders-events"
echo "  - payments-commands"
echo "  - payments-events"
echo "  - emails-commands"
echo "  - emails-events"
echo "  - analytics-commands"
echo "  - analytics-events"
echo "  - business-events"
echo ""
echo "🔍 Vérification des topics :"
cd ../kafka
node -e "
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ clientId: 'check-topics', brokers: ['localhost:9092'] });
const admin = kafka.admin();

async function checkTopics() {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    console.log('📋 Topics disponibles:', topics);
    await admin.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkTopics();
"

echo ""
echo "🎉 Architecture Commands vs Events déployée avec succès !" 