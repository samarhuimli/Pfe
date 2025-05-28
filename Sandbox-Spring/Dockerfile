FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/SandboxSpring-0.0.1-SNAPSHOT.jar app.jar

# Désactive complètement la sécurité
ENV SPRING_SECURITY_ENABLED=false
ENV JAVA_OPTS="-Dserver.port=8085 -Dlogging.level.org.springframework.web=DEBUG"

EXPOSE 8085
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]