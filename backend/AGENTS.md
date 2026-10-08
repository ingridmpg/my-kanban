
## Architecture

Follow SOLID principles pragmatically, without over-engineering:

- Single responsibility: keep HTTP routes, business logic and database access in separate modules. Routes stay thin.
- Dependency inversion: inject dependencies (e.g. the database session) with FastAPI `Depends` instead of importing globals, so they can be swapped in tests.
- Only add an abstraction (interface, base class, repository layer) when there is a real second implementation or a concrete testing need. Plain functions and modules are preferred over classes when they suffice.
- Do not create layers, patterns or extension points for hypothetical future needs.
