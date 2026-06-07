FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .

RUN mvn -B -q -e dependency:resolve || echo "Some dependencies may need to be downloaded during build"

COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
