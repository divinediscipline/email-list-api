cp .env ./dist
cp .sequelizerc ./dist 2>/dev/null || echo ".sequelizerc not found, skipping..."
cp serverless.yml ./dist
cp -R node_modules ./dist
