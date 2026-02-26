@echo off
echo ========================================================
echo Démarrage de MedAction en mode LOCAL
echo ========================================================

echo 1. Arrêt des conteneurs existants...
docker-compose down

echo.
echo 2. Démarrage de l'application (Build)...
docker-compose up -d --build

echo.
echo 3. Démarrage de Dockge (Manager)...
docker-compose -f dockge-compose.yml up -d

echo.
echo ========================================================
echo SUCCÈS !
echo.
echo Application MedAction : http://localhost:3000
echo Base de Données       : localhost:5433
echo Gestion (Dockge)      : http://localhost:5001
echo ========================================================
pause
