# Fastapi-Latest - Other

**Pages:** 24

---

## Including WSGI - Flask, Django, others¶

**URL:** https://fastapi.tiangolo.com/advanced/wsgi/

**Contents:**
- Including WSGI - Flask, Django, others¶
- Using WSGIMiddleware¶
- Check it¶

You can mount WSGI applications as you saw with Sub Applications - Mounts, Behind a Proxy.

For that, you can use the WSGIMiddleware and use it to wrap your WSGI application, for example, Flask, Django, etc.

You need to import WSGIMiddleware.

Then wrap the WSGI (e.g. Flask) app with the middleware.

And then mount that under a path.

Now, every request under the path /v1/ will be handled by the Flask application.

And the rest will be handled by FastAPI.

If you run it and go to http://localhost:8000/v1/ you will see the response from Flask:

And if you go to http://localhost:8000/v2 you will see the response from FastAPI:

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware
from flask import Flask, request
from markupsafe import escape

flask_app = Flask(__name__)


@flask_app.route("/")
def flask_main():
    name = request.args.get("name", "World")
    return f"Hello, {escape(name)} from Flask!"


app = FastAPI()


@app.get("/v2")
def read_main():
    return {"message": "Hello World"}


app.mount("/v1", WSGIMiddleware(flask_app))
```

Example 2 (sql):
```sql
Hello, World from Flask!
```

Example 3 (json):
```json
{
    "message": "Hello World"
}
```

---

## Templates¶

**URL:** https://fastapi.tiangolo.com/advanced/templates/

**Contents:**
- Templates¶
- Install dependencies¶
- Using Jinja2Templates¶
- Writing templates¶
  - Template Context Values¶
  - Template url_for Arguments¶
- Templates and static files¶
- More details¶

You can use any template engine you want with FastAPI.

A common choice is Jinja2, the same one used by Flask and other tools.

There are utilities to configure it easily that you can use directly in your FastAPI application (provided by Starlette).

Make sure you create a virtual environment, activate it, and install jinja2:

Before FastAPI 0.108.0, Starlette 0.29.0, the name was the first parameter.

Also, before that, in previous versions, the request object was passed as part of the key-value pairs in the context for Jinja2.

By declaring response_class=HTMLResponse the docs UI will be able to know that the response will be HTML.

You could also use from starlette.templating import Jinja2Templates.

FastAPI provides the same starlette.templating as fastapi.templating just as a convenience for you, the developer. But most of the available responses come directly from Starlette. The same with Request and StaticFiles.

Then you can write a template at templates/item.html with, for example:

In the HTML that contains:

...it will show the id taken from the "context" dict you passed:

For example, with an ID of 42, this would render:

You can also use url_for() inside of the template, it takes as arguments the same arguments that would be used by your path operation function.

So, the section with:

...will generate a link to the same URL that would be handled by the path operation function read_item(id=id).

For example, with an ID of 42, this would render:

You can also use url_for() inside of the template, and use it, for example, with the StaticFiles you mounted with the name="static".

In this example, it would link to a CSS file at static/styles.css with:

And because you are using StaticFiles, that CSS file would be served automatically by your FastAPI application at the URL /static/styles.css.

For more details, including how to test templates, check Starlette's docs on templates.

**Examples:**

Example 1 (php):
```php
$ pip install jinja2

---> 100%
```

Example 2 (python):
```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


templates = Jinja2Templates(directory="templates")


@app.get("/items/{id}", response_class=HTMLResponse)
async def read_item(request: Request, id: str):
    return templates.TemplateResponse(
        request=request, name="item.html", context={"id": id}
    )
```

Example 3 (html):
```html
<html>
<head>
    <title>Item Details</title>
    <link href="{{ url_for('static', path='/styles.css') }}" rel="stylesheet">
</head>
<body>
    <h1><a href="{{ url_for('read_item', id=id) }}">Item ID: {{ id }}</a></h1>
</body>
</html>
```

Example 4 (json):
```json
Item ID: {{ id }}
```

---

## Behind a Proxy¶

**URL:** https://fastapi.tiangolo.com/advanced/behind-a-proxy/

**Contents:**
- Behind a Proxy¶
- Proxy Forwarded Headers¶
  - Enable Proxy Forwarded Headers¶
  - Redirects with HTTPS¶
  - How Proxy Forwarded Headers Work¶
- Proxy with a stripped path prefix¶
  - Providing the root_path¶
  - Checking the current root_path¶
  - Setting the root_path in the FastAPI app¶
  - About root_path¶

In many situations, you would use a proxy like Traefik or Nginx in front of your FastAPI app.

These proxies could handle HTTPS certificates and other things.

A proxy in front of your application would normally set some headers on the fly before sending the requests to your server to let the server know that the request was forwarded by the proxy, letting it know the original (public) URL, including the domain, that it is using HTTPS, etc.

The server program (for example Uvicorn via FastAPI CLI) is capable of interpreting these headers, and then passing that information to your application.

But for security, as the server doesn't know it is behind a trusted proxy, it won't interpret those headers.

The proxy headers are:

You can start FastAPI CLI with the CLI Option --forwarded-allow-ips and pass the IP addresses that should be trusted to read those forwarded headers.

If you set it to --forwarded-allow-ips="*" it would trust all the incoming IPs.

If your server is behind a trusted proxy and only the proxy talks to it, this would make it accept whatever is the IP of that proxy.

For example, let's say you define a path operation /items/:

If the client tries to go to /items, by default, it would be redirected to /items/.

But before setting the CLI Option --forwarded-allow-ips it could redirect to http://localhost:8000/items/.

But maybe your application is hosted at https://mysuperapp.com, and the redirection should be to https://mysuperapp.com/items/.

By setting --proxy-headers now FastAPI would be able to redirect to the right location. 😎

If you want to learn more about HTTPS, check the guide About HTTPS.

Here's a visual representation of how the proxy adds forwarded headers between the client and the application server:

The proxy intercepts the original client request and adds the special forwarded headers (X-Forwarded-*) before passing the request to the application server.

These headers preserve information about the original request that would otherwise be lost:

When FastAPI CLI is configured with --forwarded-allow-ips, it trusts these headers and uses them, for example to generate the correct URLs in redirects.

You could have a proxy that adds a path prefix to your application.

In these cases you can use root_path to configure your application.

The root_path is a mechanism provided by the ASGI specification (that FastAPI is built on, through Starlette).

The root_path is used to handle these specific cases.

And it's also used internally when mounting sub-applications.

Having a proxy with a stripped path prefix, in this case, means that you could declare a path at /app in your code, but then, you add a layer on top (the proxy) that would put your FastAPI application under a path like /api/v1.

In this case, the original path /app would actually be served at /api/v1/app.

Even though all your code is written assuming there's just /app.

And the proxy would be "stripping" the path prefix on the fly before transmitting the request to the app server (probably Uvicorn via FastAPI CLI), keeping your application convinced that it is being served at /app, so that you don't have to update all your code to include the prefix /api/v1.

Up to here, everything would work as normally.

But then, when you open the integrated docs UI (the frontend), it would expect to get the OpenAPI schema at /openapi.json, instead of /api/v1/openapi.json.

So, the frontend (that runs in the browser) would try to reach /openapi.json and wouldn't be able to get the OpenAPI schema.

Because we have a proxy with a path prefix of /api/v1 for our app, the frontend needs to fetch the OpenAPI schema at /api/v1/openapi.json.

The IP 0.0.0.0 is commonly used to mean that the program listens on all the IPs available in that machine/server.

The docs UI would also need the OpenAPI schema to declare that this API server is located at /api/v1 (behind the proxy). For example:

In this example, the "Proxy" could be something like Traefik. And the server would be something like FastAPI CLI with Uvicorn, running your FastAPI application.

To achieve this, you can use the command line option --root-path like:

If you use Hypercorn, it also has the option --root-path.

The ASGI specification defines a root_path for this use case.

And the --root-path command line option provides that root_path.

You can get the current root_path used by your application for each request, it is part of the scope dictionary (that's part of the ASGI spec).

Here we are including it in the message just for demonstration purposes.

Then, if you start Uvicorn with:

The response would be something like:

Alternatively, if you don't have a way to provide a command line option like --root-path or equivalent, you can set the root_path parameter when creating your FastAPI app:

Passing the root_path to FastAPI would be the equivalent of passing the --root-path command line option to Uvicorn or Hypercorn.

Keep in mind that the server (Uvicorn) won't use that root_path for anything else than passing it to the app.

But if you go with your browser to http://127.0.0.1:8000/app you will see the normal response:

So, it won't expect to be accessed at http://127.0.0.1:8000/api/v1/app.

Uvicorn will expect the proxy to access Uvicorn at http://127.0.0.1:8000/app, and then it would be the proxy's responsibility to add the extra /api/v1 prefix on top.

Keep in mind that a proxy with stripped path prefix is only one of the ways to configure it.

Probably in many cases the default will be that the proxy doesn't have a stripped path prefix.

In a case like that (without a stripped path prefix), the proxy would listen on something like https://myawesomeapp.com, and then if the browser goes to https://myawesomeapp.com/api/v1/app and your server (e.g. Uvicorn) listens on http://127.0.0.1:8000 the proxy (without a stripped path prefix) would access Uvicorn at the same path: http://127.0.0.1:8000/api/v1/app.

You can easily run the experiment locally with a stripped path prefix using Traefik.

Download Traefik, it's a single binary, you can extract the compressed file and run it directly from the terminal.

Then create a file traefik.toml with:

This tells Traefik to listen on port 9999 and to use another file routes.toml.

We are using port 9999 instead of the standard HTTP port 80 so that you don't have to run it with admin (sudo) privileges.

Now create that other file routes.toml:

This file configures Traefik to use the path prefix /api/v1.

And then Traefik will redirect its requests to your Uvicorn running on http://127.0.0.1:8000.

And now start your app, using the --root-path option:

Now, if you go to the URL with the port for Uvicorn: http://127.0.0.1:8000/app, you will see the normal response:

Notice that even though you are accessing it at http://127.0.0.1:8000/app it shows the root_path of /api/v1, taken from the option --root-path.

And now open the URL with the port for Traefik, including the path prefix: http://127.0.0.1:9999/api/v1/app.

We get the same response:

but this time at the URL with the prefix path provided by the proxy: /api/v1.

Of course, the idea here is that everyone would access the app through the proxy, so the version with the path prefix /api/v1 is the "correct" one.

And the version without the path prefix (http://127.0.0.1:8000/app), provided by Uvicorn directly, would be exclusively for the proxy (Traefik) to access it.

That demonstrates how the Proxy (Traefik) uses the path prefix and how the server (Uvicorn) uses the root_path from the option --root-path.

But here's the fun part. ✨

The "official" way to access the app would be through the proxy with the path prefix that we defined. So, as we would expect, if you try the docs UI served by Uvicorn directly, without the path prefix in the URL, it won't work, because it expects to be accessed through the proxy.

You can check it at http://127.0.0.1:8000/docs:

But if we access the docs UI at the "official" URL using the proxy with port 9999, at /api/v1/docs, it works correctly! 🎉

You can check it at http://127.0.0.1:9999/api/v1/docs:

Right as we wanted it. ✔️

This is because FastAPI uses this root_path to create the default server in OpenAPI with the URL provided by root_path.

This is a more advanced use case. Feel free to skip it.

By default, FastAPI will create a server in the OpenAPI schema with the URL for the root_path.

But you can also provide other alternative servers, for example if you want the same docs UI to interact with both a staging and a production environment.

If you pass a custom list of servers and there's a root_path (because your API lives behind a proxy), FastAPI will insert a "server" with this root_path at the beginning of the list.

Will generate an OpenAPI schema like:

Notice the auto-generated server with a url value of /api/v1, taken from the root_path.

In the docs UI at http://127.0.0.1:9999/api/v1/docs it would look like:

The docs UI will interact with the server that you select.

The servers property in the OpenAPI specification is optional.

If you don't specify the servers parameter and root_path is equal to /, the servers property in the generated OpenAPI schema will be omitted entirely by default, which is the equivalent of a single server with a url value of /.

If you don't want FastAPI to include an automatic server using the root_path, you can use the parameter root_path_in_servers=False:

and then it won't include it in the OpenAPI schema.

If you need to mount a sub-application (as described in Sub Applications - Mounts) while also using a proxy with root_path, you can do it normally, as you would expect.

FastAPI will internally use the root_path smartly, so it will just work. ✨

**Examples:**

Example 1 (jsx):
```jsx
$ fastapi run --forwarded-allow-ips="*"

<span style="color: green;">INFO</span>:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Example 2 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/")
def read_items():
    return ["plumbus", "portal gun"]
```

Example 3 (yaml):
```yaml
https://mysuperapp.com/items/
```

Example 4 (jsx):
```jsx
sequenceDiagram
    participant Client
    participant Proxy as Proxy/Load Balancer
    participant Server as FastAPI Server

    Client->>Proxy: HTTPS Request<br/>Host: mysuperapp.com<br/>Path: /items

    Note over Proxy: Proxy adds forwarded headers

    Proxy->>Server: HTTP Request<br/>X-Forwarded-For: [client IP]<br/>X-Forwarded-Proto: https<br/>X-Forwarded-Host: mysuperapp.com<br/>Path: /items

    Note over Server: Server interprets headers<br/>(if --forwarded-allow-ips is set)

    Server->>Proxy: HTTP Response<br/>with correct HTTPS URLs

    Proxy->>Client: HTTPS Response
```

---

## Settings and Environment Variables¶

**URL:** https://fastapi.tiangolo.com/advanced/settings/

**Contents:**
- Settings and Environment Variables¶
- Types and validation¶
- Pydantic Settings¶
  - Install pydantic-settings¶
  - Create the Settings object¶
  - Use the settings¶
  - Run the server¶
- Settings in another module¶
- Settings in a dependency¶
  - The config file¶

In many cases your application could need some external settings or configurations, for example secret keys, database credentials, credentials for email services, etc.

Most of these settings are variable (can change), like database URLs. And many could be sensitive, like secrets.

For this reason it's common to provide them in environment variables that are read by the application.

To understand environment variables you can read Environment Variables.

These environment variables can only handle text strings, as they are external to Python and have to be compatible with other programs and the rest of the system (and even with different operating systems, as Linux, Windows, macOS).

That means that any value read in Python from an environment variable will be a str, and any conversion to a different type or any validation has to be done in code.

Fortunately, Pydantic provides a great utility to handle these settings coming from environment variables with Pydantic: Settings management.

First, make sure you create your virtual environment, activate it, and then install the pydantic-settings package:

It also comes included when you install the all extras with:

Import BaseSettings from Pydantic and create a sub-class, very much like with a Pydantic model.

The same way as with Pydantic models, you declare class attributes with type annotations, and possibly default values.

You can use all the same validation features and tools you use for Pydantic models, like different data types and additional validations with Field().

If you want something quick to copy and paste, don't use this example, use the last one below.

Then, when you create an instance of that Settings class (in this case, in the settings object), Pydantic will read the environment variables in a case-insensitive way, so, an upper-case variable APP_NAME will still be read for the attribute app_name.

Next it will convert and validate the data. So, when you use that settings object, you will have data of the types you declared (e.g. items_per_user will be an int).

Then you can use the new settings object in your application:

Next, you would run the server passing the configurations as environment variables, for example you could set an ADMIN_EMAIL and APP_NAME with:

To set multiple env vars for a single command just separate them with a space, and put them all before the command.

And then the admin_email setting would be set to "deadpool@example.com".

The app_name would be "ChimichangApp".

And the items_per_user would keep its default value of 50.

You could put those settings in another module file as you saw in Bigger Applications - Multiple Files.

For example, you could have a file config.py with:

And then use it in a file main.py:

You would also need a file __init__.py as you saw in Bigger Applications - Multiple Files.

In some occasions it might be useful to provide the settings from a dependency, instead of having a global object with settings that is used everywhere.

This could be especially useful during testing, as it's very easy to override a dependency with your own custom settings.

Coming from the previous example, your config.py file could look like:

Prefer to use the Annotated version if possible.

Notice that now we don't create a default instance settings = Settings().

Now we create a dependency that returns a new config.Settings().

Prefer to use the Annotated version if possible.

We'll discuss the @lru_cache in a bit.

For now you can assume get_settings() is a normal function.

And then we can require it from the path operation function as a dependency and use it anywhere we need it.

Prefer to use the Annotated version if possible.

Then it would be very easy to provide a different settings object during testing by creating a dependency override for get_settings:

Prefer to use the Annotated version if possible.

In the dependency override we set a new value for the admin_email when creating the new Settings object, and then we return that new object.

Then we can test that it is used.

If you have many settings that possibly change a lot, maybe in different environments, it might be useful to put them on a file and then read them from it as if they were environment variables.

This practice is common enough that it has a name, these environment variables are commonly placed in a file .env, and the file is called a "dotenv".

A file starting with a dot (.) is a hidden file in Unix-like systems, like Linux and macOS.

But a dotenv file doesn't really have to have that exact filename.

Pydantic has support for reading from these types of files using an external library. You can read more at Pydantic Settings: Dotenv (.env) support.

For this to work, you need to pip install python-dotenv.

You could have a .env file with:

And then update your config.py with:

Prefer to use the Annotated version if possible.

The model_config attribute is used just for Pydantic configuration. You can read more at Pydantic: Concepts: Configuration.

Here we define the config env_file inside of your Pydantic Settings class, and set the value to the filename with the dotenv file we want to use.

Reading a file from disk is normally a costly (slow) operation, so you probably want to do it only once and then reuse the same settings object, instead of reading it for each request.

But every time we do:

a new Settings object would be created, and at creation it would read the .env file again.

If the dependency function was just like:

we would create that object for each request, and we would be reading the .env file for each request. ⚠️

But as we are using the @lru_cache decorator on top, the Settings object will be created only once, the first time it's called. ✔️

Prefer to use the Annotated version if possible.

Then for any subsequent call of get_settings() in the dependencies for the next requests, instead of executing the internal code of get_settings() and creating a new Settings object, it will return the same object that was returned on the first call, again and again.

@lru_cache modifies the function it decorates to return the same value that was returned the first time, instead of computing it again, executing the code of the function every time.

So, the function below it will be executed once for each combination of arguments. And then the values returned by each of those combinations of arguments will be used again and again whenever the function is called with exactly the same combination of arguments.

For example, if you have a function:

your program could execute like this:

In the case of our dependency get_settings(), the function doesn't even take any arguments, so it always returns the same value.

That way, it behaves almost as if it was just a global variable. But as it uses a dependency function, then we can override it easily for testing.

@lru_cache is part of functools which is part of Python's standard library, you can read more about it in the Python docs for @lru_cache.

You can use Pydantic Settings to handle the settings or configurations for your application, with all the power of Pydantic models.

**Examples:**

Example 1 (php):
```php
$ pip install pydantic-settings
---> 100%
```

Example 2 (php):
```php
$ pip install "fastapi[all]"
---> 100%
```

Example 3 (python):
```python
from fastapi import FastAPI
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Awesome API"
    admin_email: str
    items_per_user: int = 50


settings = Settings()
app = FastAPI()


@app.get("/info")
async def info():
    return {
        "app_name": settings.app_name,
        "admin_email": settings.admin_email,
        "items_per_user": settings.items_per_user,
    }
```

Example 4 (python):
```python
from fastapi import FastAPI
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Awesome API"
    admin_email: str
    items_per_user: int = 50


settings = Settings()
app = FastAPI()


@app.get("/info")
async def info():
    return {
        "app_name": settings.app_name,
        "admin_email": settings.admin_email,
        "items_per_user": settings.items_per_user,
    }
```

---

## Path Operation Advanced Configuration¶

**URL:** https://fastapi.tiangolo.com/advanced/path-operation-advanced-configuration/

**Contents:**
- Path Operation Advanced Configuration¶
- OpenAPI operationId¶
  - Using the path operation function name as the operationId¶
- Exclude from OpenAPI¶
- Advanced description from docstring¶
- Additional Responses¶
- OpenAPI Extra¶
  - OpenAPI Extensions¶
  - Custom OpenAPI path operation schema¶
  - Custom OpenAPI content type¶

If you are not an "expert" in OpenAPI, you probably don't need this.

You can set the OpenAPI operationId to be used in your path operation with the parameter operation_id.

You would have to make sure that it is unique for each operation.

If you want to use your APIs' function names as operationIds, you can iterate over all of them and override each path operation's operation_id using their APIRoute.name.

You should do it after adding all your path operations.

If you manually call app.openapi(), you should update the operationIds before that.

If you do this, you have to make sure each one of your path operation functions has a unique name.

Even if they are in different modules (Python files).

To exclude a path operation from the generated OpenAPI schema (and thus, from the automatic documentation systems), use the parameter include_in_schema and set it to False:

You can limit the lines used from the docstring of a path operation function for OpenAPI.

Adding an \f (an escaped "form feed" character) causes FastAPI to truncate the output used for OpenAPI at this point.

It won't show up in the documentation, but other tools (such as Sphinx) will be able to use the rest.

You probably have seen how to declare the response_model and status_code for a path operation.

That defines the metadata about the main response of a path operation.

You can also declare additional responses with their models, status codes, etc.

There's a whole chapter here in the documentation about it, you can read it at Additional Responses in OpenAPI.

When you declare a path operation in your application, FastAPI automatically generates the relevant metadata about that path operation to be included in the OpenAPI schema.

In the OpenAPI specification it is called the Operation Object.

It has all the information about the path operation and is used to generate the automatic documentation.

It includes the tags, parameters, requestBody, responses, etc.

This path operation-specific OpenAPI schema is normally generated automatically by FastAPI, but you can also extend it.

This is a low level extension point.

If you only need to declare additional responses, a more convenient way to do it is with Additional Responses in OpenAPI.

You can extend the OpenAPI schema for a path operation using the parameter openapi_extra.

This openapi_extra can be helpful, for example, to declare OpenAPI Extensions:

If you open the automatic API docs, your extension will show up at the bottom of the specific path operation.

And if you see the resulting OpenAPI (at /openapi.json in your API), you will see your extension as part of the specific path operation too:

The dictionary in openapi_extra will be deeply merged with the automatically generated OpenAPI schema for the path operation.

So, you could add additional data to the automatically generated schema.

For example, you could decide to read and validate the request with your own code, without using the automatic features of FastAPI with Pydantic, but you could still want to define the request in the OpenAPI schema.

You could do that with openapi_extra:

In this example, we didn't declare any Pydantic model. In fact, the request body is not even parsed as JSON, it is read directly as bytes, and the function magic_data_reader() would be in charge of parsing it in some way.

Nevertheless, we can declare the expected schema for the request body.

Using this same trick, you could use a Pydantic model to define the JSON Schema that is then included in the custom OpenAPI schema section for the path operation.

And you could do this even if the data type in the request is not JSON.

For example, in this application we don't use FastAPI's integrated functionality to extract the JSON Schema from Pydantic models nor the automatic validation for JSON. In fact, we are declaring the request content type as YAML, not JSON:

Nevertheless, although we are not using the default integrated functionality, we are still using a Pydantic model to manually generate the JSON Schema for the data that we want to receive in YAML.

Then we use the request directly, and extract the body as bytes. This means that FastAPI won't even try to parse the request payload as JSON.

And then in our code, we parse that YAML content directly, and then we are again using the same Pydantic model to validate the YAML content:

Here we reuse the same Pydantic model.

But the same way, we could have validated it in some other way.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/", operation_id="some_specific_id_you_define")
async def read_items():
    return [{"item_id": "Foo"}]
```

Example 2 (python):
```python
from fastapi import FastAPI
from fastapi.routing import APIRoute

app = FastAPI()


@app.get("/items/")
async def read_items():
    return [{"item_id": "Foo"}]


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.

    Should be called only after all routes have been added.
    """
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name  # in this case, 'read_items'


use_route_names_as_operation_ids(app)
```

Example 3 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/", include_in_schema=False)
async def read_items():
    return [{"item_id": "Foo"}]
```

Example 4 (python):
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None
    tags: set[str] = set()


@app.post("/items/", response_model=Item, summary="Create an item")
async def create_item(item: Item):
    """
    Create an item with all the information:

    - **name**: each item must have a name
    - **description**: a long description
    - **price**: required
    - **tax**: if the item doesn't have tax, you can omit this
    - **tags**: a set of unique tag strings for this item
    \f
    :param item: User input.
    """
    return item
```

---

## Using the Request Directly¶

**URL:** https://fastapi.tiangolo.com/advanced/using-request-directly/

**Contents:**
- Using the Request Directly¶
- Details about the Request object¶
- Use the Request object directly¶
- Request documentation¶

Up to now, you have been declaring the parts of the request that you need with their types.

And by doing so, FastAPI is validating that data, converting it and generating documentation for your API automatically.

But there are situations where you might need to access the Request object directly.

As FastAPI is actually Starlette underneath, with a layer of several tools on top, you can use Starlette's Request object directly when you need to.

It would also mean that if you get data from the Request object directly (for example, read the body) it won't be validated, converted or documented (with OpenAPI, for the automatic API user interface) by FastAPI.

Although any other parameter declared normally (for example, the body with a Pydantic model) would still be validated, converted, annotated, etc.

But there are specific cases where it's useful to get the Request object.

Let's imagine you want to get the client's IP address/host inside of your path operation function.

For that you need to access the request directly.

By declaring a path operation function parameter with the type being the Request FastAPI will know to pass the Request in that parameter.

Note that in this case, we are declaring a path parameter beside the request parameter.

So, the path parameter will be extracted, validated, converted to the specified type and annotated with OpenAPI.

The same way, you can declare any other parameter as normally, and additionally, get the Request too.

You can read more details about the Request object in the official Starlette documentation site.

You could also use from starlette.requests import Request.

FastAPI provides it directly just as a convenience for you, the developer. But it comes directly from Starlette.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI, Request

app = FastAPI()


@app.get("/items/{item_id}")
def read_root(item_id: str, request: Request):
    client_host = request.client.host
    return {"client_host": client_host, "item_id": item_id}
```

---

## FastAPI¶

**URL:** https://fastapi.tiangolo.com/

**Contents:**
- FastAPI¶
- Sponsors¶
  - Keystone Sponsor¶
  - Gold and Silver Sponsors¶
- Opinions¶
- FastAPI mini documentary¶
- Typer, the FastAPI of CLIs¶
- Requirements¶
- Installation¶
- Example¶

FastAPI framework, high performance, easy to learn, fast to code, ready for production

Documentation: https://fastapi.tiangolo.com

Source Code: https://github.com/fastapi/fastapi

FastAPI is a modern, fast (high-performance), web framework for building APIs with Python based on standard Python type hints.

The key features are:

* estimation based on tests conducted by an internal development team, building production applications.

"[...] I'm using FastAPI a ton these days. [...] I'm actually planning to use it for all of my team's ML services at Microsoft. Some of them are getting integrated into the core Windows product and some Office products."

"We adopted the FastAPI library to spawn a REST server that can be queried to obtain predictions. [for Ludwig]"

"Netflix is pleased to announce the open-source release of our crisis management orchestration framework: Dispatch! [built with FastAPI]"

"I’m over the moon excited about FastAPI. It’s so fun!"

"Honestly, what you've built looks super solid and polished. In many ways, it's what I wanted Hug to be - it's really inspiring to see someone build that."

"If you're looking to learn one modern framework for building REST APIs, check out FastAPI [...] It's fast, easy to use and easy to learn [...]"

"We've switched over to FastAPI for our APIs [...] I think you'll like it [...]"

"If anyone is looking to build a production Python API, I would highly recommend FastAPI. It is beautifully designed, simple to use and highly scalable, it has become a key component in our API first development strategy and is driving many automations and services such as our Virtual TAC Engineer."

There's a FastAPI mini documentary released at the end of 2025, you can watch it online:

If you are building a CLI app to be used in the terminal instead of a web API, check out Typer.

Typer is FastAPI's little sibling. And it's intended to be the FastAPI of CLIs. ⌨️ 🚀

FastAPI stands on the shoulders of giants:

Create and activate a virtual environment and then install FastAPI:

Note: Make sure you put "fastapi[standard]" in quotes to ensure it works in all terminals.

Create a file main.py with:

If your code uses async / await, use async def:

If you don't know, check the "In a hurry?" section about async and await in the docs.

The command fastapi dev reads your main.py file, detects the FastAPI app in it, and starts a server using Uvicorn.

By default, fastapi dev will start with auto-reload enabled for local development.

You can read more about it in the FastAPI CLI docs.

Open your browser at http://127.0.0.1:8000/items/5?q=somequery.

You will see the JSON response as:

You already created an API that:

Now go to http://127.0.0.1:8000/docs.

You will see the automatic interactive API documentation (provided by Swagger UI):

And now, go to http://127.0.0.1:8000/redoc.

You will see the alternative automatic documentation (provided by ReDoc):

Now modify the file main.py to receive a body from a PUT request.

Declare the body using standard Python types, thanks to Pydantic.

The fastapi dev server should reload automatically.

Now go to http://127.0.0.1:8000/docs.

And now, go to http://127.0.0.1:8000/redoc.

In summary, you declare once the types of parameters, body, etc. as function parameters.

You do that with standard modern Python types.

You don't have to learn a new syntax, the methods or classes of a specific library, etc.

Just standard Python.

For example, for an int:

or for a more complex Item model:

...and with that single declaration you get:

Coming back to the previous code example, FastAPI will:

We just scratched the surface, but you already get the idea of how it all works.

Try changing the line with:

...and see how your editor will auto-complete the attributes and know their types:

For a more complete example including more features, see the Tutorial - User Guide.

Spoiler alert: the tutorial - user guide includes:

You can optionally deploy your FastAPI app to FastAPI Cloud, go and join the waiting list if you haven't. 🚀

If you already have a FastAPI Cloud account (we invited you from the waiting list 😉), you can deploy your application with one command.

Before deploying, make sure you are logged in:

Then deploy your app:

That's it! Now you can access your app at that URL. ✨

FastAPI Cloud is built by the same author and team behind FastAPI.

It streamlines the process of building, deploying, and accessing an API with minimal effort.

It brings the same developer experience of building apps with FastAPI to deploying them to the cloud. 🎉

FastAPI Cloud is the primary sponsor and funding provider for the FastAPI and friends open source projects. ✨

FastAPI is open source and based on standards. You can deploy FastAPI apps to any cloud provider you choose.

Follow your cloud provider's guides to deploy FastAPI apps with them. 🤓

Independent TechEmpower benchmarks show FastAPI applications running under Uvicorn as one of the fastest Python frameworks available, only below Starlette and Uvicorn themselves (used internally by FastAPI). (*)

To understand more about it, see the section Benchmarks.

FastAPI depends on Pydantic and Starlette.

When you install FastAPI with pip install "fastapi[standard]" it comes with the standard group of optional dependencies:

If you don't want to include the standard optional dependencies, you can install with pip install fastapi instead of pip install "fastapi[standard]".

If you want to install FastAPI with the standard dependencies but without the fastapi-cloud-cli, you can install with pip install "fastapi[standard-no-fastapi-cloud-cli]".

There are some additional dependencies you might want to install.

Additional optional Pydantic dependencies:

Additional optional FastAPI dependencies:

This project is licensed under the terms of the MIT license.

**Examples:**

Example 1 (php):
```php
$ pip install "fastapi[standard]"

---> 100%
```

Example 2 (python):
```python
from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
```

Example 3 (python):
```python
from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
```

Example 4 (yaml):
```yaml
$ fastapi dev main.py

 ╭────────── FastAPI CLI - Development mode ───────────╮
 │                                                     │
 │  Serving at: http://127.0.0.1:8000                  │
 │                                                     │
 │  API docs: http://127.0.0.1:8000/docs               │
 │                                                     │
 │  Running in development mode, for production use:   │
 │                                                     │
 │  fastapi run                                        │
 │                                                     │
 ╰─────────────────────────────────────────────────────╯

INFO:     Will watch for changes in these directories: ['/home/user/code/awesomeapp']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [2248755] using WatchFiles
INFO:     Started server process [2248757]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Return a Response Directly¶

**URL:** https://fastapi.tiangolo.com/advanced/response-directly/

**Contents:**
- Return a Response Directly¶
- Return a Response¶
- Using the jsonable_encoder in a Response¶
- Returning a custom Response¶
- Notes¶

When you create a FastAPI path operation you can normally return any data from it: a dict, a list, a Pydantic model, a database model, etc.

By default, FastAPI would automatically convert that return value to JSON using the jsonable_encoder explained in JSON Compatible Encoder.

Then, behind the scenes, it would put that JSON-compatible data (e.g. a dict) inside of a JSONResponse that would be used to send the response to the client.

But you can return a JSONResponse directly from your path operations.

It might be useful, for example, to return custom headers or cookies.

In fact, you can return any Response or any sub-class of it.

JSONResponse itself is a sub-class of Response.

And when you return a Response, FastAPI will pass it directly.

It won't do any data conversion with Pydantic models, it won't convert the contents to any type, etc.

This gives you a lot of flexibility. You can return any data type, override any data declaration or validation, etc.

Because FastAPI doesn't make any changes to a Response you return, you have to make sure its contents are ready for it.

For example, you cannot put a Pydantic model in a JSONResponse without first converting it to a dict with all the data types (like datetime, UUID, etc) converted to JSON-compatible types.

For those cases, you can use the jsonable_encoder to convert your data before passing it to a response:

You could also use from starlette.responses import JSONResponse.

FastAPI provides the same starlette.responses as fastapi.responses just as a convenience for you, the developer. But most of the available responses come directly from Starlette.

The example above shows all the parts you need, but it's not very useful yet, as you could have just returned the item directly, and FastAPI would put it in a JSONResponse for you, converting it to a dict, etc. All that by default.

Now, let's see how you could use that to return a custom response.

Let's say that you want to return an XML response.

You could put your XML content in a string, put that in a Response, and return it:

When you return a Response directly its data is not validated, converted (serialized), or documented automatically.

But you can still document it as described in Additional Responses in OpenAPI.

You can see in later sections how to use/declare these custom Responses while still having automatic data conversion, documentation, etc.

**Examples:**

Example 1 (python):
```python
from datetime import datetime

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class Item(BaseModel):
    title: str
    timestamp: datetime
    description: str | None = None


app = FastAPI()


@app.put("/items/{id}")
def update_item(id: str, item: Item):
    json_compatible_item_data = jsonable_encoder(item)
    return JSONResponse(content=json_compatible_item_data)
```

Example 2 (python):
```python
from datetime import datetime
from typing import Union

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class Item(BaseModel):
    title: str
    timestamp: datetime
    description: Union[str, None] = None


app = FastAPI()


@app.put("/items/{id}")
def update_item(id: str, item: Item):
    json_compatible_item_data = jsonable_encoder(item)
    return JSONResponse(content=json_compatible_item_data)
```

Example 3 (python):
```python
from fastapi import FastAPI, Response

app = FastAPI()


@app.get("/legacy/")
def get_legacy_data():
    data = """<?xml version="1.0"?>
    <shampoo>
    <Header>
        Apply shampoo here.
    </Header>
    <Body>
        You'll have to use soap here.
    </Body>
    </shampoo>
    """
    return Response(content=data, media_type="application/xml")
```

---

## Additional Status Codes¶

**URL:** https://fastapi.tiangolo.com/advanced/additional-status-codes/

**Contents:**
- Additional Status Codes¶
- Additional status codes¶
- OpenAPI and API docs¶

By default, FastAPI will return the responses using a JSONResponse, putting the content you return from your path operation inside of that JSONResponse.

It will use the default status code or the one you set in your path operation.

If you want to return additional status codes apart from the main one, you can do that by returning a Response directly, like a JSONResponse, and set the additional status code directly.

For example, let's say that you want to have a path operation that allows to update items, and returns HTTP status codes of 200 "OK" when successful.

But you also want it to accept new items. And when the items didn't exist before, it creates them, and returns an HTTP status code of 201 "Created".

To achieve that, import JSONResponse, and return your content there directly, setting the status_code that you want:

Prefer to use the Annotated version if possible.

Prefer to use the Annotated version if possible.

When you return a Response directly, like in the example above, it will be returned directly.

It won't be serialized with a model, etc.

Make sure it has the data you want it to have, and that the values are valid JSON (if you are using JSONResponse).

You could also use from starlette.responses import JSONResponse.

FastAPI provides the same starlette.responses as fastapi.responses just as a convenience for you, the developer. But most of the available responses come directly from Starlette. The same with status.

If you return additional status codes and responses directly, they won't be included in the OpenAPI schema (the API docs), because FastAPI doesn't have a way to know beforehand what you are going to return.

But you can document that in your code, using: Additional Responses.

**Examples:**

Example 1 (python):
```python
from typing import Annotated

from fastapi import Body, FastAPI, status
from fastapi.responses import JSONResponse

app = FastAPI()

items = {"foo": {"name": "Fighters", "size": 6}, "bar": {"name": "Tenders", "size": 3}}


@app.put("/items/{item_id}")
async def upsert_item(
    item_id: str,
    name: Annotated[str | None, Body()] = None,
    size: Annotated[int | None, Body()] = None,
):
    if item_id in items:
        item = items[item_id]
        item["name"] = name
        item["size"] = size
        return item
    else:
        item = {"name": name, "size": size}
        items[item_id] = item
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=item)
```

Example 2 (python):
```python
from typing import Annotated, Union

from fastapi import Body, FastAPI, status
from fastapi.responses import JSONResponse

app = FastAPI()

items = {"foo": {"name": "Fighters", "size": 6}, "bar": {"name": "Tenders", "size": 3}}


@app.put("/items/{item_id}")
async def upsert_item(
    item_id: str,
    name: Annotated[Union[str, None], Body()] = None,
    size: Annotated[Union[int, None], Body()] = None,
):
    if item_id in items:
        item = items[item_id]
        item["name"] = name
        item["size"] = size
        return item
    else:
        item = {"name": name, "size": size}
        items[item_id] = item
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=item)
```

Example 3 (python):
```python
from fastapi import Body, FastAPI, status
from fastapi.responses import JSONResponse

app = FastAPI()

items = {"foo": {"name": "Fighters", "size": 6}, "bar": {"name": "Tenders", "size": 3}}


@app.put("/items/{item_id}")
async def upsert_item(
    item_id: str,
    name: str | None = Body(default=None),
    size: int | None = Body(default=None),
):
    if item_id in items:
        item = items[item_id]
        item["name"] = name
        item["size"] = size
        return item
    else:
        item = {"name": name, "size": size}
        items[item_id] = item
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=item)
```

Example 4 (python):
```python
from typing import Union

from fastapi import Body, FastAPI, status
from fastapi.responses import JSONResponse

app = FastAPI()

items = {"foo": {"name": "Fighters", "size": 6}, "bar": {"name": "Tenders", "size": 3}}


@app.put("/items/{item_id}")
async def upsert_item(
    item_id: str,
    name: Union[str, None] = Body(default=None),
    size: Union[int, None] = Body(default=None),
):
    if item_id in items:
        item = items[item_id]
        item["name"] = name
        item["size"] = size
        return item
    else:
        item = {"name": name, "size": size}
        items[item_id] = item
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=item)
```

---

## Response - Change Status Code¶

**URL:** https://fastapi.tiangolo.com/advanced/response-change-status-code/

**Contents:**
- Response - Change Status Code¶
- Use case¶
- Use a Response parameter¶

You probably read before that you can set a default Response Status Code.

But in some cases you need to return a different status code than the default.

For example, imagine that you want to return an HTTP status code of "OK" 200 by default.

But if the data didn't exist, you want to create it, and return an HTTP status code of "CREATED" 201.

But you still want to be able to filter and convert the data you return with a response_model.

For those cases, you can use a Response parameter.

You can declare a parameter of type Response in your path operation function (as you can do for cookies and headers).

And then you can set the status_code in that temporal response object.

And then you can return any object you need, as you normally would (a dict, a database model, etc).

And if you declared a response_model, it will still be used to filter and convert the object you returned.

FastAPI will use that temporal response to extract the status code (also cookies and headers), and will put them in the final response that contains the value you returned, filtered by any response_model.

You can also declare the Response parameter in dependencies, and set the status code in them. But keep in mind that the last one to be set will win.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI, Response, status

app = FastAPI()

tasks = {"foo": "Listen to the Bar Fighters"}


@app.put("/get-or-create-task/{task_id}", status_code=200)
def get_or_create_task(task_id: str, response: Response):
    if task_id not in tasks:
        tasks[task_id] = "This didn't exist before"
        response.status_code = status.HTTP_201_CREATED
    return tasks[task_id]
```

---

## Lifespan Events¶

**URL:** https://fastapi.tiangolo.com/advanced/events/

**Contents:**
- Lifespan Events¶
- Use Case¶
- Lifespan¶
  - Lifespan function¶
  - Async Context Manager¶
- Alternative Events (deprecated)¶
  - startup event¶
  - shutdown event¶
  - startup and shutdown together¶
- Technical Details¶

You can define logic (code) that should be executed before the application starts up. This means that this code will be executed once, before the application starts receiving requests.

The same way, you can define logic (code) that should be executed when the application is shutting down. In this case, this code will be executed once, after having handled possibly many requests.

Because this code is executed before the application starts taking requests, and right after it finishes handling requests, it covers the whole application lifespan (the word "lifespan" will be important in a second 😉).

This can be very useful for setting up resources that you need to use for the whole app, and that are shared among requests, and/or that you need to clean up afterwards. For example, a database connection pool, or loading a shared machine learning model.

Let's start with an example use case and then see how to solve it with this.

Let's imagine that you have some machine learning models that you want to use to handle requests. 🤖

The same models are shared among requests, so, it's not one model per request, or one per user or something similar.

Let's imagine that loading the model can take quite some time, because it has to read a lot of data from disk. So you don't want to do it for every request.

You could load it at the top level of the module/file, but that would also mean that it would load the model even if you are just running a simple automated test, then that test would be slow because it would have to wait for the model to load before being able to run an independent part of the code.

That's what we'll solve, let's load the model before the requests are handled, but only right before the application starts receiving requests, not while the code is being loaded.

You can define this startup and shutdown logic using the lifespan parameter of the FastAPI app, and a "context manager" (I'll show you what that is in a second).

Let's start with an example and then see it in detail.

We create an async function lifespan() with yield like this:

Here we are simulating the expensive startup operation of loading the model by putting the (fake) model function in the dictionary with machine learning models before the yield. This code will be executed before the application starts taking requests, during the startup.

And then, right after the yield, we unload the model. This code will be executed after the application finishes handling requests, right before the shutdown. This could, for example, release resources like memory or a GPU.

The shutdown would happen when you are stopping the application.

Maybe you need to start a new version, or you just got tired of running it. 🤷

The first thing to notice, is that we are defining an async function with yield. This is very similar to Dependencies with yield.

The first part of the function, before the yield, will be executed before the application starts.

And the part after the yield will be executed after the application has finished.

If you check, the function is decorated with an @asynccontextmanager.

That converts the function into something called an "async context manager".

A context manager in Python is something that you can use in a with statement, for example, open() can be used as a context manager:

In recent versions of Python, there's also an async context manager. You would use it with async with:

When you create a context manager or an async context manager like above, what it does is that, before entering the with block, it will execute the code before the yield, and after exiting the with block, it will execute the code after the yield.

In our code example above, we don't use it directly, but we pass it to FastAPI for it to use it.

The lifespan parameter of the FastAPI app takes an async context manager, so we can pass our new lifespan async context manager to it.

The recommended way to handle the startup and shutdown is using the lifespan parameter of the FastAPI app as described above. If you provide a lifespan parameter, startup and shutdown event handlers will no longer be called. It's all lifespan or all events, not both.

You can probably skip this part.

There's an alternative way to define this logic to be executed during startup and during shutdown.

You can define event handlers (functions) that need to be executed before the application starts up, or when the application is shutting down.

These functions can be declared with async def or normal def.

To add a function that should be run before the application starts, declare it with the event "startup":

In this case, the startup event handler function will initialize the items "database" (just a dict) with some values.

You can add more than one event handler function.

And your application won't start receiving requests until all the startup event handlers have completed.

To add a function that should be run when the application is shutting down, declare it with the event "shutdown":

Here, the shutdown event handler function will write a text line "Application shutdown" to a file log.txt.

In the open() function, the mode="a" means "append", so, the line will be added after whatever is on that file, without overwriting the previous contents.

Notice that in this case we are using a standard Python open() function that interacts with a file.

So, it involves I/O (input/output), that requires "waiting" for things to be written to disk.

But open() doesn't use async and await.

So, we declare the event handler function with standard def instead of async def.

There's a high chance that the logic for your startup and shutdown is connected, you might want to start something and then finish it, acquire a resource and then release it, etc.

Doing that in separated functions that don't share logic or variables together is more difficult as you would need to store values in global variables or similar tricks.

Because of that, it's now recommended to instead use the lifespan as explained above.

Just a technical detail for the curious nerds. 🤓

Underneath, in the ASGI technical specification, this is part of the Lifespan Protocol, and it defines events called startup and shutdown.

You can read more about the Starlette lifespan handlers in Starlette's Lifespan' docs.

Including how to handle lifespan state that can be used in other areas of your code.

🚨 Keep in mind that these lifespan events (startup and shutdown) will only be executed for the main application, not for Sub Applications - Mounts.

**Examples:**

Example 1 (python):
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


def fake_answer_to_everything_ml_model(x: float):
    return x * 42


ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    ml_models["answer_to_everything"] = fake_answer_to_everything_ml_model
    yield
    # Clean up the ML models and release the resources
    ml_models.clear()


app = FastAPI(lifespan=lifespan)


@app.get("/predict")
async def predict(x: float):
    result = ml_models["answer_to_everything"](x)
    return {"result": result}
```

Example 2 (python):
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


def fake_answer_to_everything_ml_model(x: float):
    return x * 42


ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    ml_models["answer_to_everything"] = fake_answer_to_everything_ml_model
    yield
    # Clean up the ML models and release the resources
    ml_models.clear()


app = FastAPI(lifespan=lifespan)


@app.get("/predict")
async def predict(x: float):
    result = ml_models["answer_to_everything"](x)
    return {"result": result}
```

Example 3 (python):
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


def fake_answer_to_everything_ml_model(x: float):
    return x * 42


ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    ml_models["answer_to_everything"] = fake_answer_to_everything_ml_model
    yield
    # Clean up the ML models and release the resources
    ml_models.clear()


app = FastAPI(lifespan=lifespan)


@app.get("/predict")
async def predict(x: float):
    result = ml_models["answer_to_everything"](x)
    return {"result": result}
```

Example 4 (typescript):
```typescript
with open("file.txt") as file:
    file.read()
```

---

## Response Cookies¶

**URL:** https://fastapi.tiangolo.com/advanced/response-cookies/

**Contents:**
- Response Cookies¶
- Use a Response parameter¶
- Return a Response directly¶
  - More info¶

You can declare a parameter of type Response in your path operation function.

And then you can set cookies in that temporal response object.

And then you can return any object you need, as you normally would (a dict, a database model, etc).

And if you declared a response_model, it will still be used to filter and convert the object you returned.

FastAPI will use that temporal response to extract the cookies (also headers and status code), and will put them in the final response that contains the value you returned, filtered by any response_model.

You can also declare the Response parameter in dependencies, and set cookies (and headers) in them.

You can also create cookies when returning a Response directly in your code.

To do that, you can create a response as described in Return a Response Directly.

Then set Cookies in it, and then return it:

Keep in mind that if you return a response directly instead of using the Response parameter, FastAPI will return it directly.

So, you will have to make sure your data is of the correct type. E.g. it is compatible with JSON, if you are returning a JSONResponse.

And also that you are not sending any data that should have been filtered by a response_model.

You could also use from starlette.responses import Response or from starlette.responses import JSONResponse.

FastAPI provides the same starlette.responses as fastapi.responses just as a convenience for you, the developer. But most of the available responses come directly from Starlette.

And as the Response can be used frequently to set headers and cookies, FastAPI also provides it at fastapi.Response.

To see all the available parameters and options, check the documentation in Starlette.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI, Response

app = FastAPI()


@app.post("/cookie-and-object/")
def create_cookie(response: Response):
    response.set_cookie(key="fakesession", value="fake-cookie-session-value")
    return {"message": "Come to the dark side, we have cookies"}
```

Example 2 (python):
```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()


@app.post("/cookie/")
def create_cookie():
    content = {"message": "Come to the dark side, we have cookies"}
    response = JSONResponse(content=content)
    response.set_cookie(key="fakesession", value="fake-cookie-session-value")
    return response
```

---

## Generating SDKs¶

**URL:** https://fastapi.tiangolo.com/advanced/generate-clients/

**Contents:**
- Generating SDKs¶
- Open Source SDK Generators¶
- SDK Generators from FastAPI Sponsors¶
- Create a TypeScript SDK¶
  - API Docs¶
  - Hey API¶
  - Using the SDK¶
- FastAPI App with Tags¶
  - Generate a TypeScript Client with Tags¶
  - Client Method Names¶

Because FastAPI is based on the OpenAPI specification, its APIs can be described in a standard format that many tools understand.

This makes it easy to generate up-to-date documentation, client libraries (SDKs) in multiple languages, and testing or automation workflows that stay in sync with your code.

In this guide, you'll learn how to generate a TypeScript SDK for your FastAPI backend.

A versatile option is the OpenAPI Generator, which supports many programming languages and can generate SDKs from your OpenAPI specification.

For TypeScript clients, Hey API is a purpose-built solution, providing an optimized experience for the TypeScript ecosystem.

You can discover more SDK generators on OpenAPI.Tools.

FastAPI automatically generates OpenAPI 3.1 specifications, so any tool you use must support this version.

This section highlights venture-backed and company-supported solutions from companies that sponsor FastAPI. These products provide additional features and integrations on top of high-quality generated SDKs.

By ✨ sponsoring FastAPI ✨, these companies help ensure the framework and its ecosystem remain healthy and sustainable.

Their sponsorship also demonstrates a strong commitment to the FastAPI community (you), showing that they care not only about offering a great service but also about supporting a robust and thriving framework, FastAPI. 🙇

For example, you might want to try:

Some of these solutions may also be open source or offer free tiers, so you can try them without a financial commitment. Other commercial SDK generators are available and can be found online. 🤓

Let's start with a simple FastAPI application:

Notice that the path operations define the models they use for request payload and response payload, using the models Item and ResponseMessage.

If you go to /docs, you will see that it has the schemas for the data to be sent in requests and received in responses:

You can see those schemas because they were declared with the models in the app.

That information is available in the app's OpenAPI schema, and then shown in the API docs.

That same information from the models that is included in OpenAPI is what can be used to generate the client code.

Once we have a FastAPI app with the models, we can use Hey API to generate a TypeScript client. The fastest way to do that is via npx.

This will generate a TypeScript SDK in ./src/client.

You can learn how to install @hey-api/openapi-ts and read about the generated output on their website.

Now you can import and use the client code. It could look like this, notice that you get autocompletion for the methods:

You will also get autocompletion for the payload to send:

Notice the autocompletion for name and price, that was defined in the FastAPI application, in the Item model.

You will have inline errors for the data that you send:

The response object will also have autocompletion:

In many cases, your FastAPI app will be bigger, and you will probably use tags to separate different groups of path operations.

For example, you could have a section for items and another section for users, and they could be separated by tags:

If you generate a client for a FastAPI app using tags, it will normally also separate the client code based on the tags.

This way, you will be able to have things ordered and grouped correctly for the client code:

In this case, you have:

Right now, the generated method names like createItemItemsPost don't look very clean:

...that's because the client generator uses the OpenAPI internal operation ID for each path operation.

OpenAPI requires that each operation ID is unique across all the path operations, so FastAPI uses the function name, the path, and the HTTP method/operation to generate that operation ID, because that way it can make sure that the operation IDs are unique.

But I'll show you how to improve that next. 🤓

You can modify the way these operation IDs are generated to make them simpler and have simpler method names in the clients.

In this case, you will have to ensure that each operation ID is unique in some other way.

For example, you could make sure that each path operation has a tag, and then generate the operation ID based on the tag and the path operation name (the function name).

FastAPI uses a unique ID for each path operation, which is used for the operation ID and also for the names of any needed custom models, for requests or responses.

You can customize that function. It takes an APIRoute and outputs a string.

For example, here it is using the first tag (you will probably have only one tag) and the path operation name (the function name).

You can then pass that custom function to FastAPI as the generate_unique_id_function parameter:

Now, if you generate the client again, you will see that it has the improved method names:

As you see, the method names now have the tag and then the function name, now they don't include information from the URL path and the HTTP operation.

The generated code still has some duplicated information.

We already know that this method is related to the items because that word is in the ItemsService (taken from the tag), but we still have the tag name prefixed in the method name too. 😕

We will probably still want to keep it for OpenAPI in general, as that will ensure that the operation IDs are unique.

But for the generated client, we could modify the OpenAPI operation IDs right before generating the clients, just to make those method names nicer and cleaner.

We could download the OpenAPI JSON to a file openapi.json and then we could remove that prefixed tag with a script like this:

With that, the operation IDs would be renamed from things like items-get_items to just get_items, that way the client generator can generate simpler method names.

Since the end result is now in an openapi.json file, you need to update your input location:

After generating the new client, you would now have clean method names, with all the autocompletion, inline errors, etc:

When using the automatically generated clients, you would get autocompletion for:

You would also have inline errors for everything.

And whenever you update the backend code, and regenerate the frontend, it would have any new path operations available as methods, the old ones removed, and any other change would be reflected on the generated code. 🤓

This also means that if something changed, it will be reflected on the client code automatically. And if you build the client, it will error out if you have any mismatch in the data used.

So, you would detect many errors very early in the development cycle instead of having to wait for the errors to show up to your final users in production and then trying to debug where the problem is. ✨

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    price: float


class ResponseMessage(BaseModel):
    message: str


@app.post("/items/", response_model=ResponseMessage)
async def create_item(item: Item):
    return {"message": "item received"}


@app.get("/items/", response_model=list[Item])
async def get_items():
    return [
        {"name": "Plumbus", "price": 3},
        {"name": "Portal Gun", "price": 9001},
    ]
```

Example 2 (python):
```python
npx @hey-api/openapi-ts -i http://localhost:8000/openapi.json -o src/client
```

Example 3 (python):
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    price: float


class ResponseMessage(BaseModel):
    message: str


class User(BaseModel):
    username: str
    email: str


@app.post("/items/", response_model=ResponseMessage, tags=["items"])
async def create_item(item: Item):
    return {"message": "Item received"}


@app.get("/items/", response_model=list[Item], tags=["items"])
async def get_items():
    return [
        {"name": "Plumbus", "price": 3},
        {"name": "Portal Gun", "price": 9001},
    ]


@app.post("/users/", response_model=ResponseMessage, tags=["users"])
async def create_user(user: User):
    return {"message": "User received"}
```

Example 4 (css):
```css
ItemsService.createItemItemsPost({name: "Plumbus", price: 5})
```

---

## Additional Responses in OpenAPI¶

**URL:** https://fastapi.tiangolo.com/advanced/additional-responses/

**Contents:**
- Additional Responses in OpenAPI¶
- Additional Response with model¶
- Additional media types for the main response¶
- Combining information¶
- Combine predefined responses and custom ones¶
- More information about OpenAPI responses¶

This is a rather advanced topic.

If you are starting with FastAPI, you might not need this.

You can declare additional responses, with additional status codes, media types, descriptions, etc.

Those additional responses will be included in the OpenAPI schema, so they will also appear in the API docs.

But for those additional responses you have to make sure you return a Response like JSONResponse directly, with your status code and content.

You can pass to your path operation decorators a parameter responses.

It receives a dict: the keys are status codes for each response (like 200), and the values are other dicts with the information for each of them.

Each of those response dicts can have a key model, containing a Pydantic model, just like response_model.

FastAPI will take that model, generate its JSON Schema and include it in the correct place in OpenAPI.

For example, to declare another response with a status code 404 and a Pydantic model Message, you can write:

Keep in mind that you have to return the JSONResponse directly.

The model key is not part of OpenAPI.

FastAPI will take the Pydantic model from there, generate the JSON Schema, and put it in the correct place.

The correct place is:

The generated responses in the OpenAPI for this path operation will be:

The schemas are referenced to another place inside the OpenAPI schema:

You can use this same responses parameter to add different media types for the same main response.

For example, you can add an additional media type of image/png, declaring that your path operation can return a JSON object (with media type application/json) or a PNG image:

Notice that you have to return the image using a FileResponse directly.

Unless you specify a different media type explicitly in your responses parameter, FastAPI will assume the response has the same media type as the main response class (default application/json).

But if you have specified a custom response class with None as its media type, FastAPI will use application/json for any additional response that has an associated model.

You can also combine response information from multiple places, including the response_model, status_code, and responses parameters.

You can declare a response_model, using the default status code 200 (or a custom one if you need), and then declare additional information for that same response in responses, directly in the OpenAPI schema.

FastAPI will keep the additional information from responses, and combine it with the JSON Schema from your model.

For example, you can declare a response with a status code 404 that uses a Pydantic model and has a custom description.

And a response with a status code 200 that uses your response_model, but includes a custom example:

It will all be combined and included in your OpenAPI, and shown in the API docs:

You might want to have some predefined responses that apply to many path operations, but you want to combine them with custom responses needed by each path operation.

For those cases, you can use the Python technique of "unpacking" a dict with **dict_to_unpack:

Here, new_dict will contain all the key-value pairs from old_dict plus the new key-value pair:

You can use that technique to reuse some predefined responses in your path operations and combine them with additional custom ones.

To see what exactly you can include in the responses, you can check these sections in the OpenAPI specification:

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class Item(BaseModel):
    id: str
    value: str


class Message(BaseModel):
    message: str


app = FastAPI()


@app.get("/items/{item_id}", response_model=Item, responses={404: {"model": Message}})
async def read_item(item_id: str):
    if item_id == "foo":
        return {"id": "foo", "value": "there goes my hero"}
    return JSONResponse(status_code=404, content={"message": "Item not found"})
```

Example 2 (json):
```json
{
    "responses": {
        "404": {
            "description": "Additional Response",
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/Message"
                    }
                }
            }
        },
        "200": {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/Item"
                    }
                }
            }
        },
        "422": {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/HTTPValidationError"
                    }
                }
            }
        }
    }
}
```

Example 3 (json):
```json
{
    "components": {
        "schemas": {
            "Message": {
                "title": "Message",
                "required": [
                    "message"
                ],
                "type": "object",
                "properties": {
                    "message": {
                        "title": "Message",
                        "type": "string"
                    }
                }
            },
            "Item": {
                "title": "Item",
                "required": [
                    "id",
                    "value"
                ],
                "type": "object",
                "properties": {
                    "id": {
                        "title": "Id",
                        "type": "string"
                    },
                    "value": {
                        "title": "Value",
                        "type": "string"
                    }
                }
            },
            "ValidationError": {
                "title": "ValidationError",
                "required": [
                    "loc",
                    "msg",
                    "type"
                ],
                "type": "object",
                "properties": {
                    "loc": {
                        "title": "Location",
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "msg": {
                        "title": "Message",
                        "type": "string"
                    },
                    "type": {
                        "title": "Error Type",
                        "type": "string"
                    }
                }
            },
            "HTTPValidationError": {
                "title": "HTTPValidationError",
                "type": "object",
                "properties": {
                    "detail": {
                        "title": "Detail",
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/ValidationError"
                        }
                    }
                }
            }
        }
    }
}
```

Example 4 (python):
```python
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel


class Item(BaseModel):
    id: str
    value: str


app = FastAPI()


@app.get(
    "/items/{item_id}",
    response_model=Item,
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "Return the JSON item or an image.",
        }
    },
)
async def read_item(item_id: str, img: bool | None = None):
    if img:
        return FileResponse("image.png", media_type="image/png")
    else:
        return {"id": "foo", "value": "there goes my hero"}
```

---

## OpenAPI Callbacks¶

**URL:** https://fastapi.tiangolo.com/advanced/openapi-callbacks/

**Contents:**
- OpenAPI Callbacks¶
- An app with callbacks¶
- The normal FastAPI app¶
- Documenting the callback¶
- Write the callback documentation code¶
  - Create a callback APIRouter¶
  - Create the callback path operation¶
  - The callback path expression¶
  - Add the callback router¶
  - Check the docs¶

You could create an API with a path operation that could trigger a request to an external API created by someone else (probably the same developer that would be using your API).

The process that happens when your API app calls the external API is named a "callback". Because the software that the external developer wrote sends a request to your API and then your API calls back, sending a request to an external API (that was probably created by the same developer).

In this case, you could want to document how that external API should look like. What path operation it should have, what body it should expect, what response it should return, etc.

Let's see all this with an example.

Imagine you develop an app that allows creating invoices.

These invoices will have an id, title (optional), customer, and total.

The user of your API (an external developer) will create an invoice in your API with a POST request.

Then your API will (let's imagine):

Let's first see how the normal API app would look like before adding the callback.

It will have a path operation that will receive an Invoice body, and a query parameter callback_url that will contain the URL for the callback.

This part is pretty normal, most of the code is probably already familiar to you:

The callback_url query parameter uses a Pydantic Url type.

The only new thing is the callbacks=invoices_callback_router.routes as an argument to the path operation decorator. We'll see what that is next.

The actual callback code will depend heavily on your own API app.

And it will probably vary a lot from one app to the next.

It could be just one or two lines of code, like:

But possibly the most important part of the callback is making sure that your API user (the external developer) implements the external API correctly, according to the data that your API is going to send in the request body of the callback, etc.

So, what we will do next is add the code to document how that external API should look like to receive the callback from your API.

That documentation will show up in the Swagger UI at /docs in your API, and it will let external developers know how to build the external API.

This example doesn't implement the callback itself (that could be just a line of code), only the documentation part.

The actual callback is just an HTTP request.

When implementing the callback yourself, you could use something like HTTPX or Requests.

This code won't be executed in your app, we only need it to document how that external API should look like.

But, you already know how to easily create automatic documentation for an API with FastAPI.

So we are going to use that same knowledge to document how the external API should look like... by creating the path operation(s) that the external API should implement (the ones your API will call).

When writing the code to document a callback, it might be useful to imagine that you are that external developer. And that you are currently implementing the external API, not your API.

Temporarily adopting this point of view (of the external developer) can help you feel like it's more obvious where to put the parameters, the Pydantic model for the body, for the response, etc. for that external API.

First create a new APIRouter that will contain one or more callbacks.

To create the callback path operation use the same APIRouter you created above.

It should look just like a normal FastAPI path operation:

There are 2 main differences from a normal path operation:

The callback path can have an OpenAPI 3 expression that can contain parts of the original request sent to your API.

In this case, it's the str:

So, if your API user (the external developer) sends a request to your API to:

then your API will process the invoice, and at some point later, send a callback request to the callback_url (the external API):

with a JSON body containing something like:

and it would expect a response from that external API with a JSON body like:

Notice how the callback URL used contains the URL received as a query parameter in callback_url (https://www.external.org/events) and also the invoice id from inside of the JSON body (2expen51ve).

At this point you have the callback path operation(s) needed (the one(s) that the external developer should implement in the external API) in the callback router you created above.

Now use the parameter callbacks in your API's path operation decorator to pass the attribute .routes (that's actually just a list of routes/path operations) from that callback router:

Notice that you are not passing the router itself (invoices_callback_router) to callback=, but the attribute .routes, as in invoices_callback_router.routes.

Now you can start your app and go to http://127.0.0.1:8000/docs.

You will see your docs including a "Callbacks" section for your path operation that shows how the external API should look like:

**Examples:**

Example 1 (python):
```python
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, HttpUrl

app = FastAPI()


class Invoice(BaseModel):
    id: str
    title: str | None = None
    customer: str
    total: float


class InvoiceEvent(BaseModel):
    description: str
    paid: bool


class InvoiceEventReceived(BaseModel):
    ok: bool


invoices_callback_router = APIRouter()


@invoices_callback_router.post(
    "{$callback_url}/invoices/{$request.body.id}", response_model=InvoiceEventReceived
)
def invoice_notification(body: InvoiceEvent):
    pass


@app.post("/invoices/", callbacks=invoices_callback_router.routes)
def create_invoice(invoice: Invoice, callback_url: HttpUrl | None = None):
    """
    Create an invoice.

    This will (let's imagine) let the API user (some external developer) create an
    invoice.

    And this path operation will:

    * Send the invoice to the client.
    * Collect the money from the client.
    * Send a notification back to the API user (the external developer), as a callback.
        * At this point is that the API will somehow send a POST request to the
            external API with the notification of the invoice event
            (e.g. "payment successful").
    """
    # Send the invoice, collect the money, send the notification (the callback)
    return {"msg": "Invoice received"}
```

Example 2 (python):
```python
from typing import Union

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, HttpUrl

app = FastAPI()


class Invoice(BaseModel):
    id: str
    title: Union[str, None] = None
    customer: str
    total: float


class InvoiceEvent(BaseModel):
    description: str
    paid: bool


class InvoiceEventReceived(BaseModel):
    ok: bool


invoices_callback_router = APIRouter()


@invoices_callback_router.post(
    "{$callback_url}/invoices/{$request.body.id}", response_model=InvoiceEventReceived
)
def invoice_notification(body: InvoiceEvent):
    pass


@app.post("/invoices/", callbacks=invoices_callback_router.routes)
def create_invoice(invoice: Invoice, callback_url: Union[HttpUrl, None] = None):
    """
    Create an invoice.

    This will (let's imagine) let the API user (some external developer) create an
    invoice.

    And this path operation will:

    * Send the invoice to the client.
    * Collect the money from the client.
    * Send a notification back to the API user (the external developer), as a callback.
        * At this point is that the API will somehow send a POST request to the
            external API with the notification of the invoice event
            (e.g. "payment successful").
    """
    # Send the invoice, collect the money, send the notification (the callback)
    return {"msg": "Invoice received"}
```

Example 3 (json):
```json
callback_url = "https://example.com/api/v1/invoices/events/"
httpx.post(callback_url, json={"description": "Invoice paid", "paid": True})
```

Example 4 (python):
```python
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, HttpUrl

app = FastAPI()


class Invoice(BaseModel):
    id: str
    title: str | None = None
    customer: str
    total: float


class InvoiceEvent(BaseModel):
    description: str
    paid: bool


class InvoiceEventReceived(BaseModel):
    ok: bool


invoices_callback_router = APIRouter()


@invoices_callback_router.post(
    "{$callback_url}/invoices/{$request.body.id}", response_model=InvoiceEventReceived
)
def invoice_notification(body: InvoiceEvent):
    pass


@app.post("/invoices/", callbacks=invoices_callback_router.routes)
def create_invoice(invoice: Invoice, callback_url: HttpUrl | None = None):
    """
    Create an invoice.

    This will (let's imagine) let the API user (some external developer) create an
    invoice.

    And this path operation will:

    * Send the invoice to the client.
    * Collect the money from the client.
    * Send a notification back to the API user (the external developer), as a callback.
        * At this point is that the API will somehow send a POST request to the
            external API with the notification of the invoice event
            (e.g. "payment successful").
    """
    # Send the invoice, collect the money, send the notification (the callback)
    return {"msg": "Invoice received"}
```

---

## Response Headers¶

**URL:** https://fastapi.tiangolo.com/advanced/response-headers/

**Contents:**
- Response Headers¶
- Use a Response parameter¶
- Return a Response directly¶
- Custom Headers¶

You can declare a parameter of type Response in your path operation function (as you can do for cookies).

And then you can set headers in that temporal response object.

And then you can return any object you need, as you normally would (a dict, a database model, etc).

And if you declared a response_model, it will still be used to filter and convert the object you returned.

FastAPI will use that temporal response to extract the headers (also cookies and status code), and will put them in the final response that contains the value you returned, filtered by any response_model.

You can also declare the Response parameter in dependencies, and set headers (and cookies) in them.

You can also add headers when you return a Response directly.

Create a response as described in Return a Response Directly and pass the headers as an additional parameter:

You could also use from starlette.responses import Response or from starlette.responses import JSONResponse.

FastAPI provides the same starlette.responses as fastapi.responses just as a convenience for you, the developer. But most of the available responses come directly from Starlette.

And as the Response can be used frequently to set headers and cookies, FastAPI also provides it at fastapi.Response.

Keep in mind that custom proprietary headers can be added using the X- prefix.

But if you have custom headers that you want a client in a browser to be able to see, you need to add them to your CORS configurations (read more in CORS (Cross-Origin Resource Sharing)), using the parameter expose_headers documented in Starlette's CORS docs.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI, Response

app = FastAPI()


@app.get("/headers-and-object/")
def get_headers(response: Response):
    response.headers["X-Cat-Dog"] = "alone in the world"
    return {"message": "Hello World"}
```

Example 2 (python):
```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()


@app.get("/headers/")
def get_headers():
    content = {"message": "Hello World"}
    headers = {"X-Cat-Dog": "alone in the world", "Content-Language": "en-US"}
    return JSONResponse(content=content, headers=headers)
```

---

## Testing WebSockets¶

**URL:** https://fastapi.tiangolo.com/advanced/testing-websockets/

**Contents:**
- Testing WebSockets¶

You can use the same TestClient to test WebSockets.

For this, you use the TestClient in a with statement, connecting to the WebSocket:

For more details, check Starlette's documentation for testing WebSockets.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

app = FastAPI()


@app.get("/")
async def read_main():
    return {"msg": "Hello World"}


@app.websocket("/ws")
async def websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"msg": "Hello WebSocket"})
    await websocket.close()


def test_read_main():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}


def test_websocket():
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        data = websocket.receive_json()
        assert data == {"msg": "Hello WebSocket"}
```

---

## Sub Applications - Mounts¶

**URL:** https://fastapi.tiangolo.com/advanced/sub-applications/

**Contents:**
- Sub Applications - Mounts¶
- Mounting a FastAPI application¶
  - Top-level application¶
  - Sub-application¶
  - Mount the sub-application¶
  - Check the automatic API docs¶
  - Technical Details: root_path¶

If you need to have two independent FastAPI applications, with their own independent OpenAPI and their own docs UIs, you can have a main app and "mount" one (or more) sub-application(s).

"Mounting" means adding a completely "independent" application in a specific path, that then takes care of handling everything under that path, with the path operations declared in that sub-application.

First, create the main, top-level, FastAPI application, and its path operations:

Then, create your sub-application, and its path operations.

This sub-application is just another standard FastAPI application, but this is the one that will be "mounted":

In your top-level application, app, mount the sub-application, subapi.

In this case, it will be mounted at the path /subapi:

Now, run the fastapi command with your file:

And open the docs at http://127.0.0.1:8000/docs.

You will see the automatic API docs for the main app, including only its own path operations:

And then, open the docs for the sub-application, at http://127.0.0.1:8000/subapi/docs.

You will see the automatic API docs for the sub-application, including only its own path operations, all under the correct sub-path prefix /subapi:

If you try interacting with any of the two user interfaces, they will work correctly, because the browser will be able to talk to each specific app or sub-app.

When you mount a sub-application as described above, FastAPI will take care of communicating the mount path for the sub-application using a mechanism from the ASGI specification called a root_path.

That way, the sub-application will know to use that path prefix for the docs UI.

And the sub-application could also have its own mounted sub-applications and everything would work correctly, because FastAPI handles all these root_paths automatically.

You will learn more about the root_path and how to use it explicitly in the section about Behind a Proxy.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/app")
def read_main():
    return {"message": "Hello World from main app"}


subapi = FastAPI()


@subapi.get("/sub")
def read_sub():
    return {"message": "Hello World from sub API"}


app.mount("/subapi", subapi)
```

Example 2 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/app")
def read_main():
    return {"message": "Hello World from main app"}


subapi = FastAPI()


@subapi.get("/sub")
def read_sub():
    return {"message": "Hello World from sub API"}


app.mount("/subapi", subapi)
```

Example 3 (python):
```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/app")
def read_main():
    return {"message": "Hello World from main app"}


subapi = FastAPI()


@subapi.get("/sub")
def read_sub():
    return {"message": "Hello World from sub API"}


app.mount("/subapi", subapi)
```

Example 4 (jsx):
```jsx
$ fastapi dev main.py

<span style="color: green;">INFO</span>:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

## Using Dataclasses¶

**URL:** https://fastapi.tiangolo.com/advanced/dataclasses/

**Contents:**
- Using Dataclasses¶
- Dataclasses in response_model¶
- Dataclasses in Nested Data Structures¶
- Learn More¶
- Version¶

FastAPI is built on top of Pydantic, and I have been showing you how to use Pydantic models to declare requests and responses.

But FastAPI also supports using dataclasses the same way:

This is still supported thanks to Pydantic, as it has internal support for dataclasses.

So, even with the code above that doesn't use Pydantic explicitly, FastAPI is using Pydantic to convert those standard dataclasses to Pydantic's own flavor of dataclasses.

And of course, it supports the same:

This works the same way as with Pydantic models. And it is actually achieved in the same way underneath, using Pydantic.

Keep in mind that dataclasses can't do everything Pydantic models can do.

So, you might still need to use Pydantic models.

But if you have a bunch of dataclasses laying around, this is a nice trick to use them to power a web API using FastAPI. 🤓

You can also use dataclasses in the response_model parameter:

The dataclass will be automatically converted to a Pydantic dataclass.

This way, its schema will show up in the API docs user interface:

You can also combine dataclasses with other type annotations to make nested data structures.

In some cases, you might still have to use Pydantic's version of dataclasses. For example, if you have errors with the automatically generated API documentation.

In that case, you can simply swap the standard dataclasses with pydantic.dataclasses, which is a drop-in replacement:

We still import field from standard dataclasses.

pydantic.dataclasses is a drop-in replacement for dataclasses.

The Author dataclass includes a list of Item dataclasses.

The Author dataclass is used as the response_model parameter.

You can use other standard type annotations with dataclasses as the request body.

In this case, it's a list of Item dataclasses.

Here we are returning a dictionary that contains items which is a list of dataclasses.

FastAPI is still capable of serializing the data to JSON.

Here the response_model is using a type annotation of a list of Author dataclasses.

Again, you can combine dataclasses with standard type annotations.

Notice that this path operation function uses regular def instead of async def.

As always, in FastAPI you can combine def and async def as needed.

If you need a refresher about when to use which, check out the section "In a hurry?" in the docs about async and await.

This path operation function is not returning dataclasses (although it could), but a list of dictionaries with internal data.

FastAPI will use the response_model parameter (that includes dataclasses) to convert the response.

You can combine dataclasses with other type annotations in many different combinations to form complex data structures.

Check the in-code annotation tips above to see more specific details.

You can also combine dataclasses with other Pydantic models, inherit from them, include them in your own models, etc.

To learn more, check the Pydantic docs about dataclasses.

This is available since FastAPI version 0.67.0. 🔖

**Examples:**

Example 1 (python):
```python
from dataclasses import dataclass

from fastapi import FastAPI


@dataclass
class Item:
    name: str
    price: float
    description: str | None = None
    tax: float | None = None


app = FastAPI()


@app.post("/items/")
async def create_item(item: Item):
    return item
```

Example 2 (python):
```python
from dataclasses import dataclass
from typing import Union

from fastapi import FastAPI


@dataclass
class Item:
    name: str
    price: float
    description: Union[str, None] = None
    tax: Union[float, None] = None


app = FastAPI()


@app.post("/items/")
async def create_item(item: Item):
    return item
```

Example 3 (python):
```python
from dataclasses import dataclass, field

from fastapi import FastAPI


@dataclass
class Item:
    name: str
    price: float
    tags: list[str] = field(default_factory=list)
    description: str | None = None
    tax: float | None = None


app = FastAPI()


@app.get("/items/next", response_model=Item)
async def read_next_item():
    return {
        "name": "Island In The Moon",
        "price": 12.99,
        "description": "A place to be playin' and havin' fun",
        "tags": ["breater"],
    }
```

Example 4 (python):
```python
from dataclasses import dataclass, field
from typing import Union

from fastapi import FastAPI


@dataclass
class Item:
    name: str
    price: float
    tags: list[str] = field(default_factory=list)
    description: Union[str, None] = None
    tax: Union[float, None] = None


app = FastAPI()


@app.get("/items/next", response_model=Item)
async def read_next_item():
    return {
        "name": "Island In The Moon",
        "price": 12.99,
        "description": "A place to be playin' and havin' fun",
        "tags": ["breater"],
    }
```

---

## Custom Response - HTML, Stream, File, others¶

**URL:** https://fastapi.tiangolo.com/advanced/custom-response/

**Contents:**
- Custom Response - HTML, Stream, File, others¶
- Use ORJSONResponse¶
- HTML Response¶
  - Return a Response¶
  - Document in OpenAPI and override Response¶
    - Return an HTMLResponse directly¶
- Available responses¶
  - Response¶
  - HTMLResponse¶
  - PlainTextResponse¶

By default, FastAPI will return the responses using JSONResponse.

You can override it by returning a Response directly as seen in Return a Response directly.

But if you return a Response directly (or any subclass, like JSONResponse), the data won't be automatically converted (even if you declare a response_model), and the documentation won't be automatically generated (for example, including the specific "media type", in the HTTP header Content-Type as part of the generated OpenAPI).

But you can also declare the Response that you want to be used (e.g. any Response subclass), in the path operation decorator using the response_class parameter.

The contents that you return from your path operation function will be put inside of that Response.

And if that Response has a JSON media type (application/json), like is the case with the JSONResponse and UJSONResponse, the data you return will be automatically converted (and filtered) with any Pydantic response_model that you declared in the path operation decorator.

If you use a response class with no media type, FastAPI will expect your response to have no content, so it will not document the response format in its generated OpenAPI docs.

For example, if you are squeezing performance, you can install and use orjson and set the response to be ORJSONResponse.

Import the Response class (sub-class) you want to use and declare it in the path operation decorator.

For large responses, returning a Response directly is much faster than returning a dictionary.

This is because by default, FastAPI will inspect every item inside and make sure it is serializable as JSON, using the same JSON Compatible Encoder explained in the tutorial. This is what allows you to return arbitrary objects, for example database models.

But if you are certain that the content that you are returning is serializable with JSON, you can pass it directly to the response class and avoid the extra overhead that FastAPI would have by passing your return content through the jsonable_encoder before passing it to the response class.

The parameter response_class will also be used to define the "media type" of the response.

In this case, the HTTP header Content-Type will be set to application/json.

And it will be documented as such in OpenAPI.

The ORJSONResponse is only available in FastAPI, not in Starlette.

To return a response with HTML directly from FastAPI, use HTMLResponse.

The parameter response_class will also be used to define the "media type" of the response.

In this case, the HTTP header Content-Type will be set to text/html.

And it will be documented as such in OpenAPI.

As seen in Return a Response directly, you can also override the response directly in your path operation, by returning it.

The same example from above, returning an HTMLResponse, could look like:

A Response returned directly by your path operation function won't be documented in OpenAPI (for example, the Content-Type won't be documented) and won't be visible in the automatic interactive docs.

Of course, the actual Content-Type header, status code, etc, will come from the Response object you returned.

If you want to override the response from inside of the function but at the same time document the "media type" in OpenAPI, you can use the response_class parameter AND return a Response object.

The response_class will then be used only to document the OpenAPI path operation, but your Response will be used as is.

For example, it could be something like:

In this example, the function generate_html_response() already generates and returns a Response instead of returning the HTML in a str.

By returning the result of calling generate_html_response(), you are already returning a Response that will override the default FastAPI behavior.

But as you passed the HTMLResponse in the response_class too, FastAPI will know how to document it in OpenAPI and the interactive docs as HTML with text/html:

Here are some of the available responses.

Keep in mind that you can use Response to return anything else, or even create a custom sub-class.

You could also use from starlette.responses import HTMLResponse.

FastAPI provides the same starlette.responses as fastapi.responses just as a convenience for you, the developer. But most of the available responses come directly from Starlette.

The main Response class, all the other responses inherit from it.

You can return it directly.

It accepts the following parameters:

FastAPI (actually Starlette) will automatically include a Content-Length header. It will also include a Content-Type header, based on the media_type and appending a charset for text types.

Takes some text or bytes and returns an HTML response, as you read above.

Takes some text or bytes and returns a plain text response.

Takes some data and returns an application/json encoded response.

This is the default response used in FastAPI, as you read above.

A fast alternative JSON response using orjson, as you read above.

This requires installing orjson for example with pip install orjson.

An alternative JSON response using ujson.

This requires installing ujson for example with pip install ujson.

ujson is less careful than Python's built-in implementation in how it handles some edge-cases.

It's possible that ORJSONResponse might be a faster alternative.

Returns an HTTP redirect. Uses a 307 status code (Temporary Redirect) by default.

You can return a RedirectResponse directly:

Or you can use it in the response_class parameter:

If you do that, then you can return the URL directly from your path operation function.

In this case, the status_code used will be the default one for the RedirectResponse, which is 307.

You can also use the status_code parameter combined with the response_class parameter:

Takes an async generator or a normal generator/iterator and streams the response body.

If you have a file-like object (e.g. the object returned by open()), you can create a generator function to iterate over that file-like object.

That way, you don't have to read it all first in memory, and you can pass that generator function to the StreamingResponse, and return it.

This includes many libraries to interact with cloud storage, video processing, and others.

This yield from tells the function to iterate over that thing named file_like. And then, for each part iterated, yield that part as coming from this generator function (iterfile).

So, it is a generator function that transfers the "generating" work to something else internally.

By doing it this way, we can put it in a with block, and that way, ensure that the file-like object is closed after finishing.

Notice that here as we are using standard open() that doesn't support async and await, we declare the path operation with normal def.

Asynchronously streams a file as the response.

Takes a different set of arguments to instantiate than the other response types:

File responses will include appropriate Content-Length, Last-Modified and ETag headers.

You can also use the response_class parameter:

In this case, you can return the file path directly from your path operation function.

You can create your own custom response class, inheriting from Response and using it.

For example, let's say that you want to use orjson, but with some custom settings not used in the included ORJSONResponse class.

Let's say you want it to return indented and formatted JSON, so you want to use the orjson option orjson.OPT_INDENT_2.

You could create a CustomORJSONResponse. The main thing you have to do is create a Response.render(content) method that returns the content as bytes:

Now instead of returning:

...this response will return:

Of course, you will probably find much better ways to take advantage of this than formatting JSON. 😉

When creating a FastAPI class instance or an APIRouter you can specify which response class to use by default.

The parameter that defines this is default_response_class.

In the example below, FastAPI will use ORJSONResponse by default, in all path operations, instead of JSONResponse.

You can still override response_class in path operations as before.

You can also declare the media type and many other details in OpenAPI using responses: Additional Responses in OpenAPI.

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

app = FastAPI()


@app.get("/items/", response_class=ORJSONResponse)
async def read_items():
    return ORJSONResponse([{"item_id": "Foo"}])
```

Example 2 (python):
```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/items/", response_class=HTMLResponse)
async def read_items():
    return """
    <html>
        <head>
            <title>Some HTML in here</title>
        </head>
        <body>
            <h1>Look ma! HTML!</h1>
        </body>
    </html>
    """
```

Example 3 (python):
```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/items/")
async def read_items():
    html_content = """
    <html>
        <head>
            <title>Some HTML in here</title>
        </head>
        <body>
            <h1>Look ma! HTML!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
```

Example 4 (python):
```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


def generate_html_response():
    html_content = """
    <html>
        <head>
            <title>Some HTML in here</title>
        </head>
        <body>
            <h1>Look ma! HTML!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/items/", response_class=HTMLResponse)
async def read_items():
    return generate_html_response()
```

---

## OpenAPI Webhooks¶

**URL:** https://fastapi.tiangolo.com/advanced/openapi-webhooks/

**Contents:**
- OpenAPI Webhooks¶
- Webhooks steps¶
- Documenting webhooks with FastAPI and OpenAPI¶
- An app with webhooks¶
  - Check the docs¶

There are cases where you want to tell your API users that your app could call their app (sending a request) with some data, normally to notify of some type of event.

This means that instead of the normal process of your users sending requests to your API, it's your API (or your app) that could send requests to their system (to their API, their app).

This is normally called a webhook.

The process normally is that you define in your code what is the message that you will send, the body of the request.

You also define in some way at which moments your app will send those requests or events.

And your users define in some way (for example in a web dashboard somewhere) the URL where your app should send those requests.

All the logic about how to register the URLs for webhooks and the code to actually send those requests is up to you. You write it however you want to in your own code.

With FastAPI, using OpenAPI, you can define the names of these webhooks, the types of HTTP operations that your app can send (e.g. POST, PUT, etc.) and the request bodies that your app would send.

This can make it a lot easier for your users to implement their APIs to receive your webhook requests, they might even be able to autogenerate some of their own API code.

Webhooks are available in OpenAPI 3.1.0 and above, supported by FastAPI 0.99.0 and above.

When you create a FastAPI application, there is a webhooks attribute that you can use to define webhooks, the same way you would define path operations, for example with @app.webhooks.post().

The webhooks that you define will end up in the OpenAPI schema and the automatic docs UI.

The app.webhooks object is actually just an APIRouter, the same type you would use when structuring your app with multiple files.

Notice that with webhooks you are actually not declaring a path (like /items/), the text you pass there is just an identifier of the webhook (the name of the event), for example in @app.webhooks.post("new-subscription"), the webhook name is new-subscription.

This is because it is expected that your users would define the actual URL path where they want to receive the webhook request in some other way (e.g. a web dashboard).

Now you can start your app and go to http://127.0.0.1:8000/docs.

You will see your docs have the normal path operations and now also some webhooks:

**Examples:**

Example 1 (python):
```python
from datetime import datetime

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Subscription(BaseModel):
    username: str
    monthly_fee: float
    start_date: datetime


@app.webhooks.post("new-subscription")
def new_subscription(body: Subscription):
    """
    When a new user subscribes to your service we'll send you a POST request with this
    data to the URL that you register for the event `new-subscription` in the dashboard.
    """


@app.get("/users/")
def read_users():
    return ["Rick", "Morty"]
```

---

## WebSockets¶

**URL:** https://fastapi.tiangolo.com/advanced/websockets/

**Contents:**
- WebSockets¶
- Install websockets¶
- WebSockets client¶
  - In production¶
- Create a websocket¶
- Await for messages and send messages¶
- Try it¶
- Using Depends and others¶
  - Try the WebSockets with dependencies¶
- Handling disconnections and multiple clients¶

You can use WebSockets with FastAPI.

Make sure you create a virtual environment, activate it, and install websockets (a Python library that makes it easy to use the "WebSocket" protocol):

In your production system, you probably have a frontend created with a modern framework like React, Vue.js or Angular.

And to communicate using WebSockets with your backend you would probably use your frontend's utilities.

Or you might have a native mobile application that communicates with your WebSocket backend directly, in native code.

Or you might have any other way to communicate with the WebSocket endpoint.

But for this example, we'll use a very simple HTML document with some JavaScript, all inside a long string.

This, of course, is not optimal and you wouldn't use it for production.

In production you would have one of the options above.

But it's the simplest way to focus on the server-side of WebSockets and have a working example:

In your FastAPI application, create a websocket:

You could also use from starlette.websockets import WebSocket.

FastAPI provides the same WebSocket directly just as a convenience for you, the developer. But it comes directly from Starlette.

In your WebSocket route you can await for messages and send messages.

You can receive and send binary, text, and JSON data.

If your file is named main.py, run your application with:

Open your browser at http://127.0.0.1:8000.

You will see a simple page like:

You can type messages in the input box, and send them:

And your FastAPI application with WebSockets will respond back:

You can send (and receive) many messages:

And all of them will use the same WebSocket connection.

In WebSocket endpoints you can import from fastapi and use:

They work the same way as for other FastAPI endpoints/path operations:

Prefer to use the Annotated version if possible.

Prefer to use the Annotated version if possible.

As this is a WebSocket it doesn't really make sense to raise an HTTPException, instead we raise a WebSocketException.

You can use a closing code from the valid codes defined in the specification.

If your file is named main.py, run your application with:

Open your browser at http://127.0.0.1:8000.

Notice that the query token will be handled by a dependency.

With that you can connect the WebSocket and then send and receive messages:

When a WebSocket connection is closed, the await websocket.receive_text() will raise a WebSocketDisconnect exception, which you can then catch and handle like in this example.

That will raise the WebSocketDisconnect exception, and all the other clients will receive a message like:

The app above is a minimal and simple example to demonstrate how to handle and broadcast messages to several WebSocket connections.

But keep in mind that, as everything is handled in memory, in a single list, it will only work while the process is running, and will only work with a single process.

If you need something easy to integrate with FastAPI but that is more robust, supported by Redis, PostgreSQL or others, check encode/broadcaster.

To learn more about the options, check Starlette's documentation for:

**Examples:**

Example 1 (php):
```php
$ pip install websockets

---> 100%
```

Example 2 (python):
```python
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")
```

Example 3 (python):
```python
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")
```

Example 4 (python):
```python
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")
```

---

## Advanced User Guide¶

**URL:** https://fastapi.tiangolo.com/advanced/

**Contents:**
- Advanced User Guide¶
- Additional Features¶
- Read the Tutorial first¶

The main Tutorial - User Guide should be enough to give you a tour through all the main features of FastAPI.

In the next sections you will see other options, configurations, and additional features.

The next sections are not necessarily "advanced".

And it's possible that for your use case, the solution is in one of them.

You could still use most of the features in FastAPI with the knowledge from the main Tutorial - User Guide.

And the next sections assume you already read it, and assume that you know those main ideas.

---

## Testing Events: lifespan and startup - shutdown¶

**URL:** https://fastapi.tiangolo.com/advanced/testing-events/

**Contents:**
- Testing Events: lifespan and startup - shutdown¶

When you need lifespan to run in your tests, you can use the TestClient with a with statement:

You can read more details about the "Running lifespan in tests in the official Starlette documentation site."

For the deprecated startup and shutdown events, you can use the TestClient as follows:

**Examples:**

Example 1 (python):
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.testclient import TestClient

items = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    items["foo"] = {"name": "Fighters"}
    items["bar"] = {"name": "Tenders"}
    yield
    # clean up items
    items.clear()


app = FastAPI(lifespan=lifespan)


@app.get("/items/{item_id}")
async def read_items(item_id: str):
    return items[item_id]


def test_read_items():
    # Before the lifespan starts, "items" is still empty
    assert items == {}

    with TestClient(app) as client:
        # Inside the "with TestClient" block, the lifespan starts and items added
        assert items == {"foo": {"name": "Fighters"}, "bar": {"name": "Tenders"}}

        response = client.get("/items/foo")
        assert response.status_code == 200
        assert response.json() == {"name": "Fighters"}

        # After the requests is done, the items are still there
        assert items == {"foo": {"name": "Fighters"}, "bar": {"name": "Tenders"}}

    # The end of the "with TestClient" block simulates terminating the app, so
    # the lifespan ends and items are cleaned up
    assert items == {}
```

Example 2 (python):
```python
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

items = {}


@app.on_event("startup")
async def startup_event():
    items["foo"] = {"name": "Fighters"}
    items["bar"] = {"name": "Tenders"}


@app.get("/items/{item_id}")
async def read_items(item_id: str):
    return items[item_id]


def test_read_items():
    with TestClient(app) as client:
        response = client.get("/items/foo")
        assert response.status_code == 200
        assert response.json() == {"name": "Fighters"}
```

---
