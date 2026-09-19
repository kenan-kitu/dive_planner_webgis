FROM docker.osgeo.org/geoserver:3.0.x

ENV PORT=8080

# Render requires the HTTP listener to bind explicitly to 0.0.0.0:$PORT.
# The official image applies /opt/config/server.xml through envsubst at startup.
RUN sed -i '0,/port="8080"/s//address="0.0.0.0" port="${PORT}"/' /opt/config/server.xml \
    && grep -Fq 'address="0.0.0.0" port="${PORT}"' /opt/config/server.xml

ENV CORS_ENABLED=true \
    CORS_ALLOWED_ORIGINS=https://dive-planner-webgis.netlify.app \
    CORS_ALLOWED_METHODS=GET,POST,HEAD,OPTIONS \
    CORS_ALLOWED_HEADERS=Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers \
    CORS_ALLOW_CREDENTIALS=false

COPY data/dive_planner_data.gpkg /opt/geoserver_data/dive_planner_data.gpkg
COPY diveplanner /opt/geoserver_data/workspaces/diveplanner

EXPOSE 8080
