# Fastapi-Latest - Advanced

**Pages:** 4

---

## Testing Dependencies with Overrides¶

**URL:** https://fastapi.tiangolo.com/advanced/testing-dependencies/

**Contents:**
- Testing Dependencies with Overrides¶
- Overriding dependencies during testing¶
  - Use cases: external service¶
  - Use the app.dependency_overrides attribute¶

There are some scenarios where you might want to override a dependency during testing.

You don't want the original dependency to run (nor any of the sub-dependencies it might have).

Instead, you want to provide a different dependency that will be used only during tests (possibly only some specific tests), and will provide a value that can be used where the value of the original dependency was used.

An example could be that you have an external authentication provider that you need to call.

You send it a token and it returns an authenticated user.

This provider might be charging you per request, and calling it might take some extra time than if you had a fixed mock user for tests.

You probably want to test the external provider once, but not necessarily call it for every test that runs.

In this case, you can override the dependency that calls that provider, and use a custom dependency that returns a mock user, only for your tests.

For these cases, your FastAPI application has an attribute app.dependency_overrides, it is a simple dict.

To override a dependency for testing, you put as a key the original dependency (a function), and as the value, your dependency override (another function).

And then FastAPI will call that override instead of the original dependency.

Prefer to use the Annotated version if possible.

Prefer to use the Annotated version if possible.

You can set a dependency override for a dependency used anywhere in your FastAPI application.

The original dependency could be used in a path operation function, a path operation decorator (when you don't use the return value), a .include_router() call, etc.

FastAPI will still be able to override it.

Then you can reset your overrides (remove them) by setting app.dependency_overrides to be an empty dict:

If you want to override a dependency only during some tests, you can set the override at the beginning of the test (inside the test function) and reset it at the end (at the end of the test function).

**Examples:**

Example 1 (python):
```python
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}


@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return {"message": "Hello Items!", "params": commons}


@app.get("/users/")
async def read_users(commons: Annotated[dict, Depends(common_parameters)]):
    return {"message": "Hello Users!", "params": commons}


client = TestClient(app)


async def override_dependency(q: str | None = None):
    return {"q": q, "skip": 5, "limit": 10}


app.dependency_overrides[common_parameters] = override_dependency


def test_override_in_items():
    response = client.get("/items/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": None, "skip": 5, "limit": 10},
    }


def test_override_in_items_with_q():
    response = client.get("/items/?q=foo")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }


def test_override_in_items_with_params():
    response = client.get("/items/?q=foo&skip=100&limit=200")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }
```

Example 2 (python):
```python
from typing import Annotated, Union

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


async def common_parameters(
    q: Union[str, None] = None, skip: int = 0, limit: int = 100
):
    return {"q": q, "skip": skip, "limit": limit}


@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return {"message": "Hello Items!", "params": commons}


@app.get("/users/")
async def read_users(commons: Annotated[dict, Depends(common_parameters)]):
    return {"message": "Hello Users!", "params": commons}


client = TestClient(app)


async def override_dependency(q: Union[str, None] = None):
    return {"q": q, "skip": 5, "limit": 10}


app.dependency_overrides[common_parameters] = override_dependency


def test_override_in_items():
    response = client.get("/items/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": None, "skip": 5, "limit": 10},
    }


def test_override_in_items_with_q():
    response = client.get("/items/?q=foo")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }


def test_override_in_items_with_params():
    response = client.get("/items/?q=foo&skip=100&limit=200")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }
```

Example 3 (python):
```python
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}


@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return {"message": "Hello Items!", "params": commons}


@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    return {"message": "Hello Users!", "params": commons}


client = TestClient(app)


async def override_dependency(q: str | None = None):
    return {"q": q, "skip": 5, "limit": 10}


app.dependency_overrides[common_parameters] = override_dependency


def test_override_in_items():
    response = client.get("/items/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": None, "skip": 5, "limit": 10},
    }


def test_override_in_items_with_q():
    response = client.get("/items/?q=foo")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }


def test_override_in_items_with_params():
    response = client.get("/items/?q=foo&skip=100&limit=200")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }
```

Example 4 (python):
```python
from typing import Union

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


async def common_parameters(
    q: Union[str, None] = None, skip: int = 0, limit: int = 100
):
    return {"q": q, "skip": skip, "limit": limit}


@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return {"message": "Hello Items!", "params": commons}


@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    return {"message": "Hello Users!", "params": commons}


client = TestClient(app)


async def override_dependency(q: Union[str, None] = None):
    return {"q": q, "skip": 5, "limit": 10}


app.dependency_overrides[common_parameters] = override_dependency


def test_override_in_items():
    response = client.get("/items/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": None, "skip": 5, "limit": 10},
    }


def test_override_in_items_with_q():
    response = client.get("/items/?q=foo")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }


def test_override_in_items_with_params():
    response = client.get("/items/?q=foo&skip=100&limit=200")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello Items!",
        "params": {"q": "foo", "skip": 5, "limit": 10},
    }
```

---

## Middleware¶

**URL:** https://fastapi.tiangolo.com/reference/middleware/

**Contents:**
- Middleware¶
- fastapi.middleware.cors.CORSMiddleware ¶
  - app instance-attribute ¶
  - allow_origins instance-attribute ¶
  - allow_methods instance-attribute ¶
  - allow_headers instance-attribute ¶
  - allow_all_origins instance-attribute ¶
  - allow_all_headers instance-attribute ¶
  - preflight_explicit_allow_origin instance-attribute ¶
  - allow_origin_regex instance-attribute ¶

There are several middlewares available provided by Starlette directly.

Read more about them in the FastAPI docs for Middleware.

It can be imported from fastapi:

It can be imported from fastapi:

It can be imported from fastapi:

It can be imported from fastapi:

It can be imported from fastapi:

**Examples:**

Example 1 (rust):
```rust
CORSMiddleware(
    app,
    allow_origins=(),
    allow_methods=("GET",),
    allow_headers=(),
    allow_credentials=False,
    allow_origin_regex=None,
    expose_headers=(),
    max_age=600,
)
```

Example 2 (python):
```python
def __init__(
    self,
    app: ASGIApp,
    allow_origins: Sequence[str] = (),
    allow_methods: Sequence[str] = ("GET",),
    allow_headers: Sequence[str] = (),
    allow_credentials: bool = False,
    allow_origin_regex: str | None = None,
    expose_headers: Sequence[str] = (),
    max_age: int = 600,
) -> None:
    if "*" in allow_methods:
        allow_methods = ALL_METHODS

    compiled_allow_origin_regex = None
    if allow_origin_regex is not None:
        compiled_allow_origin_regex = re.compile(allow_origin_regex)

    allow_all_origins = "*" in allow_origins
    allow_all_headers = "*" in allow_headers
    preflight_explicit_allow_origin = not allow_all_origins or allow_credentials

    simple_headers = {}
    if allow_all_origins:
        simple_headers["Access-Control-Allow-Origin"] = "*"
    if allow_credentials:
        simple_headers["Access-Control-Allow-Credentials"] = "true"
    if expose_headers:
        simple_headers["Access-Control-Expose-Headers"] = ", ".join(expose_headers)

    preflight_headers = {}
    if preflight_explicit_allow_origin:
        # The origin value will be set in preflight_response() if it is allowed.
        preflight_headers["Vary"] = "Origin"
    else:
        preflight_headers["Access-Control-Allow-Origin"] = "*"
    preflight_headers.update(
        {
            "Access-Control-Allow-Methods": ", ".join(allow_methods),
            "Access-Control-Max-Age": str(max_age),
        }
    )
    allow_headers = sorted(SAFELISTED_HEADERS | set(allow_headers))
    if allow_headers and not allow_all_headers:
        preflight_headers["Access-Control-Allow-Headers"] = ", ".join(allow_headers)
    if allow_credentials:
        preflight_headers["Access-Control-Allow-Credentials"] = "true"

    self.app = app
    self.allow_origins = allow_origins
    self.allow_methods = allow_methods
    self.allow_headers = [h.lower() for h in allow_headers]
    self.allow_all_origins = allow_all_origins
    self.allow_all_headers = allow_all_headers
    self.preflight_explicit_allow_origin = preflight_explicit_allow_origin
    self.allow_origin_regex = compiled_allow_origin_regex
    self.simple_headers = simple_headers
    self.preflight_headers = preflight_headers
```

Example 3 (unknown):
```unknown
allow_origins = allow_origins
```

Example 4 (unknown):
```unknown
allow_methods = allow_methods
```

---

## Advanced Middleware¶

**URL:** https://fastapi.tiangolo.com/advanced/middleware/

**Contents:**
- Advanced Middleware¶
- Adding ASGI middlewares¶
- Integrated middlewares¶
- HTTPSRedirectMiddleware¶
- TrustedHostMiddleware¶
- GZipMiddleware¶
- Other middlewares¶

In the main tutorial you read how to add Custom Middleware to your application.

And then you also read how to handle CORS with the CORSMiddleware.

In this section we'll see how to use other middlewares.

As FastAPI is based on Starlette and implements the ASGI specification, you can use any ASGI middleware.

A middleware doesn't have to be made for FastAPI or Starlette to work, as long as it follows the ASGI spec.

In general, ASGI middlewares are classes that expect to receive an ASGI app as the first argument.

So, in the documentation for third-party ASGI middlewares they will probably tell you to do something like:

But FastAPI (actually Starlette) provides a simpler way to do it that makes sure that the internal middlewares handle server errors and custom exception handlers work properly.

For that, you use app.add_middleware() (as in the example for CORS).

app.add_middleware() receives a middleware class as the first argument and any additional arguments to be passed to the middleware.

FastAPI includes several middlewares for common use cases, we'll see next how to use them.

For the next examples, you could also use from starlette.middleware.something import SomethingMiddleware.

FastAPI provides several middlewares in fastapi.middleware just as a convenience for you, the developer. But most of the available middlewares come directly from Starlette.

Enforces that all incoming requests must either be https or wss.

Any incoming request to http or ws will be redirected to the secure scheme instead.

Enforces that all incoming requests have a correctly set Host header, in order to guard against HTTP Host Header attacks.

The following arguments are supported:

If an incoming request does not validate correctly then a 400 response will be sent.

Handles GZip responses for any request that includes "gzip" in the Accept-Encoding header.

The middleware will handle both standard and streaming responses.

The following arguments are supported:

There are many other ASGI middlewares.

To see other available middlewares check Starlette's Middleware docs and the ASGI Awesome List.

**Examples:**

Example 1 (python):
```python
from unicorn import UnicornMiddleware

app = SomeASGIApp()

new_app = UnicornMiddleware(app, some_config="rainbow")
```

Example 2 (python):
```python
from fastapi import FastAPI
from unicorn import UnicornMiddleware

app = FastAPI()

app.add_middleware(UnicornMiddleware, some_config="rainbow")
```

Example 3 (python):
```python
from fastapi import FastAPI
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

app.add_middleware(HTTPSRedirectMiddleware)


@app.get("/")
async def main():
    return {"message": "Hello World"}
```

Example 4 (python):
```python
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["example.com", "*.example.com"]
)


@app.get("/")
async def main():
    return {"message": "Hello World"}
```

---

## Advanced Dependencies¶

**URL:** https://fastapi.tiangolo.com/advanced/advanced-dependencies/

**Contents:**
- Advanced Dependencies¶
- Parameterized dependencies¶
- A "callable" instance¶
- Parameterize the instance¶
- Create an instance¶
- Use the instance as a dependency¶
- Dependencies with yield, HTTPException, except and Background Tasks¶
  - Dependencies with yield and scope¶
  - Dependencies with yield and StreamingResponse, Technical Details¶
    - Use Cases with Early Exit Code¶

All the dependencies we have seen are a fixed function or class.

But there could be cases where you want to be able to set parameters on the dependency, without having to declare many different functions or classes.

Let's imagine that we want to have a dependency that checks if the query parameter q contains some fixed content.

But we want to be able to parameterize that fixed content.

In Python there's a way to make an instance of a class a "callable".

Not the class itself (which is already a callable), but an instance of that class.

To do that, we declare a method __call__:

Prefer to use the Annotated version if possible.

In this case, this __call__ is what FastAPI will use to check for additional parameters and sub-dependencies, and this is what will be called to pass a value to the parameter in your path operation function later.

And now, we can use __init__ to declare the parameters of the instance that we can use to "parameterize" the dependency:

Prefer to use the Annotated version if possible.

In this case, FastAPI won't ever touch or care about __init__, we will use it directly in our code.

We could create an instance of this class with:

Prefer to use the Annotated version if possible.

And that way we are able to "parameterize" our dependency, that now has "bar" inside of it, as the attribute checker.fixed_content.

Then, we could use this checker in a Depends(checker), instead of Depends(FixedContentQueryChecker), because the dependency is the instance, checker, not the class itself.

And when solving the dependency, FastAPI will call this checker like:

...and pass whatever that returns as the value of the dependency in our path operation function as the parameter fixed_content_included:

Prefer to use the Annotated version if possible.

All this might seem contrived. And it might not be very clear how is it useful yet.

These examples are intentionally simple, but show how it all works.

In the chapters about security, there are utility functions that are implemented in this same way.

If you understood all this, you already know how those utility tools for security work underneath.

You most probably don't need these technical details.

These details are useful mainly if you had a FastAPI application older than 0.121.0 and you are facing issues with dependencies with yield.

Dependencies with yield have evolved over time to account for the different use cases and to fix some issues, here's a summary of what has changed.

In version 0.121.0, FastAPI added support for Depends(scope="function") for dependencies with yield.

Using Depends(scope="function"), the exit code after yield is executed right after the path operation function is finished, before the response is sent back to the client.

And when using Depends(scope="request") (the default), the exit code after yield is executed after the response is sent.

You can read more about it in the docs for Dependencies with yield - Early exit and scope.

Before FastAPI 0.118.0, if you used a dependency with yield, it would run the exit code after the path operation function returned but right before sending the response.

The intention was to avoid holding resources for longer than necessary, waiting for the response to travel through the network.

This change also meant that if you returned a StreamingResponse, the exit code of the dependency with yield would have been already run.

For example, if you had a database session in a dependency with yield, the StreamingResponse would not be able to use that session while streaming data because the session would have already been closed in the exit code after yield.

This behavior was reverted in 0.118.0, to make the exit code after yield be executed after the response is sent.

As you will see below, this is very similar to the behavior before version 0.106.0, but with several improvements and bug fixes for corner cases.

There are some use cases with specific conditions that could benefit from the old behavior of running the exit code of dependencies with yield before sending the response.

For example, imagine you have code that uses a database session in a dependency with yield only to verify a user, but the database session is never used again in the path operation function, only in the dependency, and the response takes a long time to be sent, like a StreamingResponse that sends data slowly, but for some reason doesn't use the database.

In this case, the database session would be held until the response is finished being sent, but if you don't use it, then it wouldn't be necessary to hold it.

Here's how it could look like:

The exit code, the automatic closing of the Session in:

...would be run after the the response finishes sending the slow data:

But as generate_stream() doesn't use the database session, it is not really necessary to keep the session open while sending the response.

If you have this specific use case using SQLModel (or SQLAlchemy), you could explicitly close the session after you don't need it anymore:

That way the session would release the database connection, so other requests could use it.

If you have a different use case that needs to exit early from a dependency with yield, please create a GitHub Discussion Question with your specific use case and why you would benefit from having early closing for dependencies with yield.

If there are compelling use cases for early closing in dependencies with yield, I would consider adding a new way to opt in to early closing.

Before FastAPI 0.110.0, if you used a dependency with yield, and then you captured an exception with except in that dependency, and you didn't raise the exception again, the exception would be automatically raised/forwarded to any exception handlers or the internal server error handler.

This was changed in version 0.110.0 to fix unhandled memory consumption from forwarded exceptions without a handler (internal server errors), and to make it consistent with the behavior of regular Python code.

Before FastAPI 0.106.0, raising exceptions after yield was not possible, the exit code in dependencies with yield was executed after the response was sent, so Exception Handlers would have already run.

This was designed this way mainly to allow using the same objects "yielded" by dependencies inside of background tasks, because the exit code would be executed after the background tasks were finished.

This was changed in FastAPI 0.106.0 with the intention to not hold resources while waiting for the response to travel through the network.

Additionally, a background task is normally an independent set of logic that should be handled separately, with its own resources (e.g. its own database connection).

So, this way you will probably have cleaner code.

If you used to rely on this behavior, now you should create the resources for background tasks inside the background task itself, and use internally only data that doesn't depend on the resources of dependencies with yield.

For example, instead of using the same database session, you would create a new database session inside of the background task, and you would obtain the objects from the database using this new session. And then instead of passing the object from the database as a parameter to the background task function, you would pass the ID of that object and then obtain the object again inside the background task function.

**Examples:**

Example 1 (python):
```python
from typing import Annotated

from fastapi import Depends, FastAPI

app = FastAPI()


class FixedContentQueryChecker:
    def __init__(self, fixed_content: str):
        self.fixed_content = fixed_content

    def __call__(self, q: str = ""):
        if q:
            return self.fixed_content in q
        return False


checker = FixedContentQueryChecker("bar")


@app.get("/query-checker/")
async def read_query_check(fixed_content_included: Annotated[bool, Depends(checker)]):
    return {"fixed_content_in_query": fixed_content_included}
```

Example 2 (python):
```python
from fastapi import Depends, FastAPI

app = FastAPI()


class FixedContentQueryChecker:
    def __init__(self, fixed_content: str):
        self.fixed_content = fixed_content

    def __call__(self, q: str = ""):
        if q:
            return self.fixed_content in q
        return False


checker = FixedContentQueryChecker("bar")


@app.get("/query-checker/")
async def read_query_check(fixed_content_included: bool = Depends(checker)):
    return {"fixed_content_in_query": fixed_content_included}
```

Example 3 (python):
```python
from typing import Annotated

from fastapi import Depends, FastAPI

app = FastAPI()


class FixedContentQueryChecker:
    def __init__(self, fixed_content: str):
        self.fixed_content = fixed_content

    def __call__(self, q: str = ""):
        if q:
            return self.fixed_content in q
        return False


checker = FixedContentQueryChecker("bar")


@app.get("/query-checker/")
async def read_query_check(fixed_content_included: Annotated[bool, Depends(checker)]):
    return {"fixed_content_in_query": fixed_content_included}
```

Example 4 (python):
```python
from fastapi import Depends, FastAPI

app = FastAPI()


class FixedContentQueryChecker:
    def __init__(self, fixed_content: str):
        self.fixed_content = fixed_content

    def __call__(self, q: str = ""):
        if q:
            return self.fixed_content in q
        return False


checker = FixedContentQueryChecker("bar")


@app.get("/query-checker/")
async def read_query_check(fixed_content_included: bool = Depends(checker)):
    return {"fixed_content_in_query": fixed_content_included}
```

---
