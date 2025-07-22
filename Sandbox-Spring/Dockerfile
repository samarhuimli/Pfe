FROM eclipse-temurin:17-jre

WORKDIR /app

# Installer Python3, Bandit, R et lintr
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-bandit r-base r-base-dev build-essential && \
    R -e "install.packages('lintr', repos='http://cran.rstudio.com/')"

COPY target/SandboxSpring-0.0.1-SNAPSHOT.jar app.jar

ENV SPRING_SECURITY_ENABLED=false
ENV JAVA_OPTS="-Dserver.port=8085 -Dlogging.level.org.springframework.web=DEBUG"

EXPOSE 8085
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]