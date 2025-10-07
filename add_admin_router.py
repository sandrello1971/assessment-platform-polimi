with open('app/main.py', 'r') as f:
    content = f.read()

# Aggiungi import
import_line = "from app.routers import radar"
new_import = "from app.routers import radar, admin"
content = content.replace(import_line, new_import)

# Aggiungi router
router_line = 'app.include_router(radar.router, prefix="/api", tags=["radar"])'
new_router = '''app.include_router(radar.router, prefix="/api", tags=["radar"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])'''
content = content.replace(router_line, new_router)

with open('app/main.py', 'w') as f:
    f.write(content)

print("✅ Router admin registrato in main.py")
