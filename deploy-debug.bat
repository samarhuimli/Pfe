@echo off
echo ========================================
echo Jenkins Pipeline Debug Helper
echo ========================================

echo.
echo 1. Checking Docker availability...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker not available
    exit /b 1
)

echo.
echo 2. Checking Docker daemon...
docker info
if %errorlevel% neq 0 (
    echo ❌ Docker daemon not running
    exit /b 1
)

echo.
echo 3. Checking if JAR exists...
if exist "Sandbox-Spring\target\*.jar" (
    echo ✅ JAR file found
    dir "Sandbox-Spring\target\*.jar"
) else (
    echo ❌ JAR file not found
    exit /b 1
)

echo.
echo 4. Testing Docker builds individually...

echo Building Spring Boot image...
cd Sandbox-Spring
docker build -t test/spring-app:debug .
if %errorlevel% neq 0 (
    echo ❌ Spring Boot Docker build failed
    cd ..
    exit /b 1
)
cd ..

echo Building Angular image...
cd angular-dashboard
docker build -t test/frontend:debug .
if %errorlevel% neq 0 (
    echo ❌ Angular Docker build failed
    cd ..
    exit /b 1
)
cd ..

echo Building Python API image...
cd python-api
docker build -t test/python-api:debug .
if %errorlevel% neq 0 (
    echo ❌ Python API Docker build failed
    cd ..
    exit /b 1
)
cd ..

echo Building R API image...
cd r-api
docker build -t test/r-api:debug .
if %errorlevel% neq 0 (
    echo ❌ R API Docker build failed
    cd ..
    exit /b 1
)
cd ..

echo.
echo ✅ All Docker builds successful!
echo.
echo 5. Checking Trivy availability...
trivy --version
if %errorlevel% neq 0 (
    echo ⚠️ Trivy not available - install from: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
) else (
    echo ✅ Trivy available
)

echo.
echo 6. Testing docker-compose...
docker-compose --version
if %errorlevel% neq 0 (
    echo ❌ docker-compose not available
    exit /b 1
)

echo.
echo ========================================
echo ✅ All checks passed! Pipeline should work.
echo ========================================
