FROM docker.osgeo.org/geoserver:3.0.x

ENV CORS_ENABLED=true \
    CORS_ALLOWED_ORIGINS=https://dive-planner-webgis.netlify.app \
    CORS_ALLOWED_METHODS=GET,POST,HEAD,OPTIONS \
    CORS_ALLOWED_HEADERS=Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers \
    CORS_ALLOW_CREDENTIALS=false

COPY data/dive_planner_data.gpkg /opt/geoserver_data/dive_planner_data.gpkg
COPY diveplanner /opt/geoserver_data/workspaces/diveplanner

EXPOSE 8080
