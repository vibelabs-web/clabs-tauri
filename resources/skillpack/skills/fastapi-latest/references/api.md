# Fastapi-Latest - Api

**Pages:** 20

---

## HTTPConnection class¶

**URL:** https://fastapi.tiangolo.com/reference/httpconnection/

**Contents:**
- HTTPConnection class¶
- fastapi.requests.HTTPConnection ¶
  - scope instance-attribute ¶
  - app property ¶
  - url property ¶
  - base_url property ¶
  - headers property ¶
  - query_params property ¶
  - path_params property ¶
  - cookies property ¶

When you want to define dependencies that should be compatible with both HTTP and WebSockets, you can define a parameter that takes an HTTPConnection instead of a Request or a WebSocket.

You can import it from fastapi.requests:

Bases: Mapping[str, Any]

A base class for incoming HTTP connections, that is used to provide any functionality that is common to both Request and WebSocket.

**Examples:**

Example 1 (sql):
```sql
from fastapi.requests import HTTPConnection
```

Example 2 (rust):
```rust
HTTPConnection(scope, receive=None)
```

Example 3 (python):
```python
def __init__(self, scope: Scope, receive: Receive | None = None) -> None:
    assert scope["type"] in ("http", "websocket")
    self.scope = scope
```

Example 4 (unknown):
```unknown
scope = scope
```

---

## APIRouter class¶

**URL:** https://fastapi.tiangolo.com/reference/apirouter/

**Contents:**
- APIRouter class¶
- fastapi.APIRouter ¶
    - Example¶
  - websocket ¶
      - Example¶
  - include_router ¶
      - Example¶
  - get ¶
      - Example¶
  - put ¶

Here's the reference information for the APIRouter class, with all its parameters, attributes and methods.

You can import the APIRouter class directly from fastapi:

APIRouter class, used to group path operations, for example to structure an app in multiple files. It would then be included in the FastAPI app, or in another APIRouter (ultimately included in the app).

Read more about it in the FastAPI docs for Bigger Applications - Multiple Files.

An optional path prefix for the router.

TYPE: str DEFAULT: ''

A list of tags to be applied to all the path operations in this router.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to all the path operations in this router.

Read more about it in the FastAPI docs for Bigger Applications - Multiple Files.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

The default response class to be used.

Read more in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Additional responses to be shown in OpenAPI.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Additional Responses in OpenAPI.

And in the FastAPI docs for Bigger Applications.

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

OpenAPI callbacks that should apply to all path operations in this router.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Note: you probably shouldn't use this parameter, it is inherited from Starlette and supported for compatibility.

A list of routes to serve incoming HTTP and WebSocket requests.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Whether to detect and redirect slashes in URLs when the client doesn't use the same format.

TYPE: bool DEFAULT: True

Default function handler for this router. Used to handle 404 Not Found errors.

TYPE: Optional[ASGIApp] DEFAULT: None

Only used internally by FastAPI to handle dependency overrides.

You shouldn't need to use it. It normally points to the FastAPI app object.

TYPE: Optional[Any] DEFAULT: None

Custom route (path operation) class to be used by this router.

Read more about it in the FastAPI docs for Custom Request and APIRoute class.

TYPE: type[APIRoute] DEFAULT: APIRoute

A list of startup event handler functions.

You should instead use the lifespan handlers.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Sequence[Callable[[], Any]]] DEFAULT: None

A list of shutdown event handler functions.

You should instead use the lifespan handlers.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Sequence[Callable[[], Any]]] DEFAULT: None

A Lifespan context manager handler. This replaces startup and shutdown functions with a single context manager.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Lifespan[Any]] DEFAULT: None

Mark all path operations in this router as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[bool] DEFAULT: None

To include (or not) all the path operations in this router in the generated OpenAPI.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Decorate a WebSocket function.

Read more about it in the FastAPI docs for WebSockets.

A name for the WebSocket. Only used internally.

TYPE: Optional[str] DEFAULT: None

A list of dependencies (using Depends()) to be used for this WebSocket.

Read more about it in the FastAPI docs for WebSockets.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

Include another APIRouter in the same current APIRouter.

Read more about it in the FastAPI docs for Bigger Applications.

The APIRouter to include.

An optional path prefix for the router.

TYPE: str DEFAULT: ''

A list of tags to be applied to all the path operations in this router.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to all the path operations in this router.

Read more about it in the FastAPI docs for Bigger Applications - Multiple Files.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

The default response class to be used.

Read more in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Additional responses to be shown in OpenAPI.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Additional Responses in OpenAPI.

And in the FastAPI docs for Bigger Applications.

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

OpenAPI callbacks that should apply to all path operations in this router.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Mark all path operations in this router as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[bool] DEFAULT: None

Include (or not) all the path operations in this router in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP GET operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP PUT operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP POST operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP DELETE operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP OPTIONS operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP HEAD operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP PATCH operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP TRACE operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add an event handler for the router.

on_event is deprecated, use lifespan event handlers instead.

Read more about it in the FastAPI docs for Lifespan Events.

The type of event. startup or shutdown.

**Examples:**

Example 1 (python):
```python
from fastapi import APIRouter
```

Example 2 (rust):
```rust
APIRouter(
    *,
    prefix="",
    tags=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    responses=None,
    callbacks=None,
    routes=None,
    redirect_slashes=True,
    default=None,
    dependency_overrides_provider=None,
    route_class=APIRoute,
    on_startup=None,
    on_shutdown=None,
    lifespan=None,
    deprecated=None,
    include_in_schema=True,
    generate_unique_id_function=Default(generate_unique_id)
)
```

Example 3 (python):
```python
from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter()


@router.get("/users/", tags=["users"])
async def read_users():
    return [{"username": "Rick"}, {"username": "Morty"}]


app.include_router(router)
```

Example 4 (python):
```python
def __init__(
    self,
    *,
    prefix: Annotated[str, Doc("An optional path prefix for the router.")] = "",
    tags: Annotated[
        Optional[list[Union[str, Enum]]],
        Doc(
            """
            A list of tags to be applied to all the *path operations* in this
            router.

            It will be added to the generated OpenAPI (e.g. visible at `/docs`).

            Read more about it in the
            [FastAPI docs for Path Operation Configuration](https://fastapi.tiangolo.com/tutorial/path-operation-configuration/).
            """
        ),
    ] = None,
    dependencies: Annotated[
        Optional[Sequence[params.Depends]],
        Doc(
            """
            A list of dependencies (using `Depends()`) to be applied to all the
            *path operations* in this router.

            Read more about it in the
            [FastAPI docs for Bigger Applications - Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/#include-an-apirouter-with-a-custom-prefix-tags-responses-and-dependencies).
            """
        ),
    ] = None,
    default_response_class: Annotated[
        type[Response],
        Doc(
            """
            The default response class to be used.

            Read more in the
            [FastAPI docs for Custom Response - HTML, Stream, File, others](https://fastapi.tiangolo.com/advanced/custom-response/#default-response-class).
            """
        ),
    ] = Default(JSONResponse),
    responses: Annotated[
        Optional[dict[Union[int, str], dict[str, Any]]],
        Doc(
            """
            Additional responses to be shown in OpenAPI.

            It will be added to the generated OpenAPI (e.g. visible at `/docs`).

            Read more about it in the
            [FastAPI docs for Additional Responses in OpenAPI](https://fastapi.tiangolo.com/advanced/additional-responses/).

            And in the
            [FastAPI docs for Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/#include-an-apirouter-with-a-custom-prefix-tags-responses-and-dependencies).
            """
        ),
    ] = None,
    callbacks: Annotated[
        Optional[list[BaseRoute]],
        Doc(
            """
            OpenAPI callbacks that should apply to all *path operations* in this
            router.

            It will be added to the generated OpenAPI (e.g. visible at `/docs`).

            Read more about it in the
            [FastAPI docs for OpenAPI Callbacks](https://fastapi.tiangolo.com/advanced/openapi-callbacks/).
            """
        ),
    ] = None,
    routes: Annotated[
        Optional[list[BaseRoute]],
        Doc(
            """
            **Note**: you probably shouldn't use this parameter, it is inherited
            from Starlette and supported for compatibility.

            ---

            A list of routes to serve incoming HTTP and WebSocket requests.
            """
        ),
        deprecated(
            """
            You normally wouldn't use this parameter with FastAPI, it is inherited
            from Starlette and supported for compatibility.

            In FastAPI, you normally would use the *path operation methods*,
            like `router.get()`, `router.post()`, etc.
            """
        ),
    ] = None,
    redirect_slashes: Annotated[
        bool,
        Doc(
            """
            Whether to detect and redirect slashes in URLs when the client doesn't
            use the same format.
            """
        ),
    ] = True,
    default: Annotated[
        Optional[ASGIApp],
        Doc(
            """
            Default function handler for this router. Used to handle
            404 Not Found errors.
            """
        ),
    ] = None,
    dependency_overrides_provider: Annotated[
        Optional[Any],
        Doc(
            """
            Only used internally by FastAPI to handle dependency overrides.

            You shouldn't need to use it. It normally points to the `FastAPI` app
            object.
            """
        ),
    ] = None,
    route_class: Annotated[
        type[APIRoute],
        Doc(
            """
            Custom route (*path operation*) class to be used by this router.

            Read more about it in the
            [FastAPI docs for Custom Request and APIRoute class](https://fastapi.tiangolo.com/how-to/custom-request-and-route/#custom-apiroute-class-in-a-router).
            """
        ),
    ] = APIRoute,
    on_startup: Annotated[
        Optional[Sequence[Callable[[], Any]]],
        Doc(
            """
            A list of startup event handler functions.

            You should instead use the `lifespan` handlers.

            Read more in the [FastAPI docs for `lifespan`](https://fastapi.tiangolo.com/advanced/events/).
            """
        ),
    ] = None,
    on_shutdown: Annotated[
        Optional[Sequence[Callable[[], Any]]],
        Doc(
            """
            A list of shutdown event handler functions.

            You should instead use the `lifespan` handlers.

            Read more in the
            [FastAPI docs for `lifespan`](https://fastapi.tiangolo.com/advanced/events/).
            """
        ),
    ] = None,
    # the generic to Lifespan[AppType] is the type of the top level application
    # which the router cannot know statically, so we use typing.Any
    lifespan: Annotated[
        Optional[Lifespan[Any]],
        Doc(
            """
            A `Lifespan` context manager handler. This replaces `startup` and
            `shutdown` functions with a single context manager.

            Read more in the
            [FastAPI docs for `lifespan`](https://fastapi.tiangolo.com/advanced/events/).
            """
        ),
    ] = None,
    deprecated: Annotated[
        Optional[bool],
        Doc(
            """
            Mark all *path operations* in this router as deprecated.

            It will be added to the generated OpenAPI (e.g. visible at `/docs`).

            Read more about it in the
            [FastAPI docs for Path Operation Configuration](https://fastapi.tiangolo.com/tutorial/path-operation-configuration/).
            """
        ),
    ] = None,
    include_in_schema: Annotated[
        bool,
        Doc(
            """
            To include (or not) all the *path operations* in this router in the
            generated OpenAPI.

            This affects the generated OpenAPI (e.g. visible at `/docs`).

            Read more about it in the
            [FastAPI docs for Query Parameters and String Validations](https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#exclude-parameters-from-openapi).
            """
        ),
    ] = True,
    generate_unique_id_function: Annotated[
        Callable[[APIRoute], str],
        Doc(
            """
            Customize the function used to generate unique IDs for the *path
            operations* shown in the generated OpenAPI.

            This is particularly useful when automatically generating clients or
            SDKs for your API.

            Read more about it in the
            [FastAPI docs about how to Generate Clients](https://fastapi.tiangolo.com/advanced/generate-clients/#custom-generate-unique-id-function).
            """
        ),
    ] = Default(generate_unique_id),
) -> None:
    super().__init__(
        routes=routes,
        redirect_slashes=redirect_slashes,
        default=default,
        on_startup=on_startup,
        on_shutdown=on_shutdown,
        lifespan=lifespan,
    )
    if prefix:
        assert prefix.startswith("/"), "A path prefix must start with '/'"
        assert not prefix.endswith("/"), (
            "A path prefix must not end with '/', as the routes will start with '/'"
        )
    self.prefix = prefix
    self.tags: list[Union[str, Enum]] = tags or []
    self.dependencies = list(dependencies or [])
    self.deprecated = deprecated
    self.include_in_schema = include_in_schema
    self.responses = responses or {}
    self.callbacks = callbacks or []
    self.dependency_overrides_provider = dependency_overrides_provider
    self.route_class = route_class
    self.default_response_class = default_response_class
    self.generate_unique_id_function = generate_unique_id_function
```

---

## FastAPI class¶

**URL:** https://fastapi.tiangolo.com/reference/fastapi/

**Contents:**
- FastAPI class¶
- fastapi.FastAPI ¶
    - Example¶
  - openapi_version instance-attribute ¶
  - webhooks instance-attribute ¶
  - state instance-attribute ¶
  - dependency_overrides instance-attribute ¶
  - openapi ¶
  - websocket ¶
  - include_router ¶

Here's the reference information for the FastAPI class, with all its parameters, attributes and methods.

You can import the FastAPI class directly from fastapi:

FastAPI app class, the main entrypoint to use FastAPI.

Read more in the FastAPI docs for First Steps.

Boolean indicating if debug tracebacks should be returned on server errors.

Read more in the Starlette docs for Applications.

TYPE: bool DEFAULT: False

Note: you probably shouldn't use this parameter, it is inherited from Starlette and supported for compatibility.

A list of routes to serve incoming HTTP and WebSocket requests.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

The title of the API.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: str DEFAULT: 'FastAPI'

A short summary of the API.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[str] DEFAULT: None

A description of the API. Supports Markdown (using CommonMark syntax).

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: str DEFAULT: ''

The version of the API.

Note This is the version of your application, not the version of the OpenAPI specification nor the version of FastAPI being used.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: str DEFAULT: '0.1.0'

The URL where the OpenAPI schema will be served from.

If you set it to None, no OpenAPI schema will be served publicly, and the default automatic endpoints /docs and /redoc will also be disabled.

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[str] DEFAULT: '/openapi.json'

A list of tags used by OpenAPI, these are the same tags you can set in the path operations, like:

The order of the tags can be used to specify the order shown in tools like Swagger UI, used in the automatic path /docs.

It's not required to specify all the tags used.

The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique.

The value of each item is a dict containing:

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[list[dict[str, Any]]] DEFAULT: None

A list of dicts with connectivity information to a target server.

You would use it, for example, if your application is served from different domains and you want to use the same Swagger UI in the browser to interact with each of them (instead of having multiple browser tabs open). Or if you want to leave fixed the possible URLs.

If the servers list is not provided, or is an empty list, the servers property in the generated OpenAPI will be:

Each item in the list is a dict containing:

Read more in the FastAPI docs for Behind a Proxy.

TYPE: Optional[list[dict[str, Union[str, Any]]]] DEFAULT: None

A list of global dependencies, they will be applied to each path operation, including in sub-routers.

Read more about it in the FastAPI docs for Global Dependencies.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

The default response class to be used.

Read more in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Whether to detect and redirect slashes in URLs when the client doesn't use the same format.

With this app, if a client goes to /items (without a trailing slash), they will be automatically redirected with an HTTP status code of 307 to /items/.

TYPE: bool DEFAULT: True

The path to the automatic interactive API documentation. It is handled in the browser by Swagger UI.

The default URL is /docs. You can disable it by setting it to None.

If openapi_url is set to None, this will be automatically disabled.

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[str] DEFAULT: '/docs'

The path to the alternative automatic interactive API documentation provided by ReDoc.

The default URL is /redoc. You can disable it by setting it to None.

If openapi_url is set to None, this will be automatically disabled.

Read more in the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[str] DEFAULT: '/redoc'

The OAuth2 redirect endpoint for the Swagger UI.

By default it is /docs/oauth2-redirect.

This is only used if you use OAuth2 (with the "Authorize" button) with Swagger UI.

TYPE: Optional[str] DEFAULT: '/docs/oauth2-redirect'

OAuth2 configuration for the Swagger UI, by default shown at /docs.

Read more about the available configuration options in the Swagger UI docs.

TYPE: Optional[dict[str, Any]] DEFAULT: None

List of middleware to be added when creating the application.

In FastAPI you would normally do this with app.add_middleware() instead.

Read more in the FastAPI docs for Middleware.

TYPE: Optional[Sequence[Middleware]] DEFAULT: None

A dictionary with handlers for exceptions.

In FastAPI, you would normally use the decorator @app.exception_handler().

Read more in the FastAPI docs for Handling Errors.

TYPE: Optional[dict[Union[int, type[Exception]], Callable[[Request, Any], Coroutine[Any, Any, Response]]]] DEFAULT: None

A list of startup event handler functions.

You should instead use the lifespan handlers.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Sequence[Callable[[], Any]]] DEFAULT: None

A list of shutdown event handler functions.

You should instead use the lifespan handlers.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Sequence[Callable[[], Any]]] DEFAULT: None

A Lifespan context manager handler. This replaces startup and shutdown functions with a single context manager.

Read more in the FastAPI docs for lifespan.

TYPE: Optional[Lifespan[AppType]] DEFAULT: None

A URL to the Terms of Service for your API.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more at the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[str] DEFAULT: None

A dictionary with the contact information for the exposed API.

It can contain several fields.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more at the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[dict[str, Union[str, Any]]] DEFAULT: None

A dictionary with the license information for the exposed API.

It can contain several fields.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more at the FastAPI docs for Metadata and Docs URLs.

TYPE: Optional[dict[str, Union[str, Any]]] DEFAULT: None

A URL prefix for the OpenAPI URL.

TYPE: str DEFAULT: ''

A path prefix handled by a proxy that is not seen by the application but is seen by external clients, which affects things like Swagger UI.

Read more about it at the FastAPI docs for Behind a Proxy.

TYPE: str DEFAULT: ''

To disable automatically generating the URLs in the servers field in the autogenerated OpenAPI using the root_path.

Read more about it in the FastAPI docs for Behind a Proxy.

TYPE: bool DEFAULT: True

Additional responses to be shown in OpenAPI.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Additional Responses in OpenAPI.

And in the FastAPI docs for Bigger Applications.

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

OpenAPI callbacks that should apply to all path operations.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Add OpenAPI webhooks. This is similar to callbacks but it doesn't depend on specific path operations.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Note: This is available since OpenAPI 3.1.0, FastAPI 0.99.0.

Read more about it in the FastAPI docs for OpenAPI Webhooks.

TYPE: Optional[APIRouter] DEFAULT: None

Mark all path operations as deprecated. You probably don't need it, but it's available.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[bool] DEFAULT: None

To include (or not) all the path operations in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Parameters to configure Swagger UI, the autogenerated interactive API documentation (by default at /docs).

Read more about it in the FastAPI docs about how to Configure Swagger UI.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Whether to generate separate OpenAPI schemas for request body and response body when the results would be more precise.

This is particularly useful when automatically generating clients.

For example, if you have a model like:

When Item is used for input, a request body, tags is not required, the client doesn't have to provide it.

But when using Item for output, for a response body, tags is always available because it has a default value, even if it's just an empty list. So, the client should be able to always expect it.

In this case, there would be two different schemas, one for input and another one for output.

TYPE: bool DEFAULT: True

This field allows you to provide additional external documentation links. If provided, it must be a dictionary containing:

TYPE: Optional[dict[str, Any]] DEFAULT: None

Extra keyword arguments to be stored in the app, not used by FastAPI anywhere.

TYPE: Any DEFAULT: {}

The version string of OpenAPI.

FastAPI will generate OpenAPI version 3.1.0, and will output that as the OpenAPI version. But some tools, even though they might be compatible with OpenAPI 3.1.0, might not recognize it as a valid.

So you could override this value to trick those tools into using the generated OpenAPI. Have in mind that this is a hack. But if you avoid using features added in OpenAPI 3.1.0, it might work for your use case.

This is not passed as a parameter to the FastAPI class to avoid giving the false idea that FastAPI would generate a different OpenAPI schema. It is only available as an attribute.

The app.webhooks attribute is an APIRouter with the path operations that will be used just for documentation of webhooks.

Read more about it in the FastAPI docs for OpenAPI Webhooks.

A state object for the application. This is the same object for the entire application, it doesn't change from request to request.

You normally wouldn't use this in FastAPI, for most of the cases you would instead use FastAPI dependencies.

This is simply inherited from Starlette.

Read more about it in the Starlette docs for Applications.

A dictionary with overrides for the dependencies.

Each key is the original dependency callable, and the value is the actual dependency that should be called.

This is for testing, to replace expensive dependencies with testing versions.

Read more about it in the FastAPI docs for Testing Dependencies with Overrides.

Generate the OpenAPI schema of the application. This is called by FastAPI internally.

The first time it is called it stores the result in the attribute app.openapi_schema, and next times it is called, it just returns that same result. To avoid the cost of generating the schema every time.

If you need to modify the generated OpenAPI schema, you could modify it.

Read more in the FastAPI docs for OpenAPI.

Decorate a WebSocket function.

Read more about it in the FastAPI docs for WebSockets.

A name for the WebSocket. Only used internally.

TYPE: Optional[str] DEFAULT: None

A list of dependencies (using Depends()) to be used for this WebSocket.

Read more about it in the FastAPI docs for WebSockets.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

Include an APIRouter in the same app.

Read more about it in the FastAPI docs for Bigger Applications.

The APIRouter to include.

An optional path prefix for the router.

TYPE: str DEFAULT: ''

A list of tags to be applied to all the path operations in this router.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to all the path operations in this router.

Read more about it in the FastAPI docs for Bigger Applications - Multiple Files.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

Additional responses to be shown in OpenAPI.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Additional Responses in OpenAPI.

And in the FastAPI docs for Bigger Applications.

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark all the path operations in this router as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Include (or not) all the path operations in this router in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Default response class to be used for the path operations in this router.

Read more in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP GET operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP PUT operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP POST operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP DELETE operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP OPTIONS operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP HEAD operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP PATCH operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add a path operation using an HTTP TRACE operation.

The URL path to be used for this path operation.

For example, in http://example.com/items, the path is /items.

The type to use for the response.

It could be any valid Pydantic field type. So, it doesn't have to be a Pydantic model, it could be other things, like a list, dict, etc.

Read more about it in the FastAPI docs for Response Model.

TYPE: Any DEFAULT: Default(None)

The default status code to be used for the response.

You could override the status code by returning a response directly.

Read more about it in the FastAPI docs for Response Status Code.

TYPE: Optional[int] DEFAULT: None

A list of tags to be applied to the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[list[Union[str, Enum]]] DEFAULT: None

A list of dependencies (using Depends()) to be applied to the path operation.

Read more about it in the FastAPI docs for Dependencies in path operation decorators.

TYPE: Optional[Sequence[Depends]] DEFAULT: None

A summary for the path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

A description for the path operation.

If not provided, it will be extracted automatically from the docstring of the path operation function.

It can contain Markdown.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Path Operation Configuration.

TYPE: Optional[str] DEFAULT: None

The description for the default response.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: str DEFAULT: 'Successful Response'

Additional responses that could be returned by this path operation.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[dict[Union[int, str], dict[str, Any]]] DEFAULT: None

Mark this path operation as deprecated.

It will be added to the generated OpenAPI (e.g. visible at /docs).

TYPE: Optional[bool] DEFAULT: None

Custom operation ID to be used by this path operation.

By default, it is generated automatically.

If you provide a custom operation ID, you need to make sure it is unique for the whole API.

You can customize the operation ID generation with the parameter generate_unique_id_function in the FastAPI class.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Optional[str] DEFAULT: None

Configuration passed to Pydantic to include only certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to exclude certain fields in the response data.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: Optional[IncEx] DEFAULT: None

Configuration passed to Pydantic to define if the response model should be serialized by alias when an alias is used.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: True

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that were not set and have their default values. This is different from response_model_exclude_defaults in that if the fields are set, they will be included in the response, even if the value is the same as the default.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should have all the fields, including the ones that have the same value as the default. This is different from response_model_exclude_unset in that if the fields are set but contain the same default values, they will be excluded from the response.

When True, default values are omitted from the response.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Configuration passed to Pydantic to define if the response data should exclude fields set to None.

This is much simpler (less smart) than response_model_exclude_unset and response_model_exclude_defaults. You probably want to use one of those two instead of this one, as those allow returning None values when it makes sense.

Read more about it in the FastAPI docs for Response Model - Return Type.

TYPE: bool DEFAULT: False

Include this path operation in the generated OpenAPI schema.

This affects the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for Query Parameters and String Validations.

TYPE: bool DEFAULT: True

Response class to be used for this path operation.

This will not be used if you return a response directly.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

TYPE: type[Response] DEFAULT: Default(JSONResponse)

Name for this path operation. Only used internally.

TYPE: Optional[str] DEFAULT: None

List of path operations that will be used as OpenAPI callbacks.

This is only for OpenAPI documentation, the callbacks won't be used directly.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Read more about it in the FastAPI docs for OpenAPI Callbacks.

TYPE: Optional[list[BaseRoute]] DEFAULT: None

Extra metadata to be included in the OpenAPI schema for this path operation.

Read more about it in the FastAPI docs for Path Operation Advanced Configuration.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Customize the function used to generate unique IDs for the path operations shown in the generated OpenAPI.

This is particularly useful when automatically generating clients or SDKs for your API.

Read more about it in the FastAPI docs about how to Generate Clients.

TYPE: Callable[[APIRoute], str] DEFAULT: Default(generate_unique_id)

Add an event handler for the application.

on_event is deprecated, use lifespan event handlers instead.

Read more about it in the FastAPI docs for Lifespan Events.

The type of event. startup or shutdown.

Add a middleware to the application.

Read more about it in the FastAPI docs for Middleware.

The type of middleware. Currently only supports http.

Add an exception handler to the app.

Read more about it in the FastAPI docs for Handling Errors.

The Exception class this would handle, or a status code.

TYPE: Union[int, type[Exception]]

**Examples:**

Example 1 (python):
```python
from fastapi import FastAPI
```

Example 2 (rust):
```rust
FastAPI(
    *,
    debug=False,
    routes=None,
    title="FastAPI",
    summary=None,
    description="",
    version="0.1.0",
    openapi_url="/openapi.json",
    openapi_tags=None,
    servers=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    redirect_slashes=True,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
    swagger_ui_init_oauth=None,
    middleware=None,
    exception_handlers=None,
    on_startup=None,
    on_shutdown=None,
    lifespan=None,
    terms_of_service=None,
    contact=None,
    license_info=None,
    openapi_prefix="",
    root_path="",
    root_path_in_servers=True,
    responses=None,
    callbacks=None,
    webhooks=None,
    deprecated=None,
    include_in_schema=True,
    swagger_ui_parameters=None,
    generate_unique_id_function=Default(generate_unique_id),
    separate_input_output_schemas=True,
    openapi_external_docs=None,
    **extra
)
```

Example 3 (python):
```python
from fastapi import FastAPI

app = FastAPI()
```

Example 4 (python):
```python
from fastapi import FastAPI

app = FastAPI(title="ChimichangApp")
```

---

## Encoders - jsonable_encoder¶

**URL:** https://fastapi.tiangolo.com/reference/encoders/

**Contents:**
- Encoders - jsonable_encoder¶
- fastapi.encoders.jsonable_encoder ¶

Convert any object to something that can be encoded in JSON.

This is used internally by FastAPI to make sure anything you return can be encoded as JSON before it is sent to the client.

You can also use it yourself, for example to convert objects before saving them in a database that supports only JSON.

Read more about it in the FastAPI docs for JSON Compatible Encoder.

The input object to convert to JSON.

Pydantic's include parameter, passed to Pydantic models to set the fields to include.

TYPE: Optional[IncEx] DEFAULT: None

Pydantic's exclude parameter, passed to Pydantic models to set the fields to exclude.

TYPE: Optional[IncEx] DEFAULT: None

Pydantic's by_alias parameter, passed to Pydantic models to define if the output should use the alias names (when provided) or the Python attribute names. In an API, if you set an alias, it's probably because you want to use it in the result, so you probably want to leave this set to True.

TYPE: bool DEFAULT: True

Pydantic's exclude_unset parameter, passed to Pydantic models to define if it should exclude from the output the fields that were not explicitly set (and that only had their default values).

TYPE: bool DEFAULT: False

Pydantic's exclude_defaults parameter, passed to Pydantic models to define if it should exclude from the output the fields that had the same default value, even when they were explicitly set.

TYPE: bool DEFAULT: False

Pydantic's exclude_none parameter, passed to Pydantic models to define if it should exclude from the output any fields that have a None value.

TYPE: bool DEFAULT: False

Pydantic's custom_encoder parameter, passed to Pydantic models to define a custom encoder.

TYPE: Optional[dict[Any, Callable[[Any], Any]]] DEFAULT: None

Exclude from the output any fields that start with the name _sa.

This is mainly a hack for compatibility with SQLAlchemy objects, they store internal SQLAlchemy-specific state in attributes named with _sa, and those objects can't (and shouldn't be) serialized to JSON.

TYPE: bool DEFAULT: True

**Examples:**

Example 1 (rust):
```rust
jsonable_encoder(
    obj,
    include=None,
    exclude=None,
    by_alias=True,
    exclude_unset=False,
    exclude_defaults=False,
    exclude_none=False,
    custom_encoder=None,
    sqlalchemy_safe=True,
)
```

Example 2 (sql):
```sql
def jsonable_encoder(
    obj: Annotated[
        Any,
        Doc(
            """
            The input object to convert to JSON.
            """
        ),
    ],
    include: Annotated[
        Optional[IncEx],
        Doc(
            """
            Pydantic's `include` parameter, passed to Pydantic models to set the
            fields to include.
            """
        ),
    ] = None,
    exclude: Annotated[
        Optional[IncEx],
        Doc(
            """
            Pydantic's `exclude` parameter, passed to Pydantic models to set the
            fields to exclude.
            """
        ),
    ] = None,
    by_alias: Annotated[
        bool,
        Doc(
            """
            Pydantic's `by_alias` parameter, passed to Pydantic models to define if
            the output should use the alias names (when provided) or the Python
            attribute names. In an API, if you set an alias, it's probably because you
            want to use it in the result, so you probably want to leave this set to
            `True`.
            """
        ),
    ] = True,
    exclude_unset: Annotated[
        bool,
        Doc(
            """
            Pydantic's `exclude_unset` parameter, passed to Pydantic models to define
            if it should exclude from the output the fields that were not explicitly
            set (and that only had their default values).
            """
        ),
    ] = False,
    exclude_defaults: Annotated[
        bool,
        Doc(
            """
            Pydantic's `exclude_defaults` parameter, passed to Pydantic models to define
            if it should exclude from the output the fields that had the same default
            value, even when they were explicitly set.
            """
        ),
    ] = False,
    exclude_none: Annotated[
        bool,
        Doc(
            """
            Pydantic's `exclude_none` parameter, passed to Pydantic models to define
            if it should exclude from the output any fields that have a `None` value.
            """
        ),
    ] = False,
    custom_encoder: Annotated[
        Optional[dict[Any, Callable[[Any], Any]]],
        Doc(
            """
            Pydantic's `custom_encoder` parameter, passed to Pydantic models to define
            a custom encoder.
            """
        ),
    ] = None,
    sqlalchemy_safe: Annotated[
        bool,
        Doc(
            """
            Exclude from the output any fields that start with the name `_sa`.

            This is mainly a hack for compatibility with SQLAlchemy objects, they
            store internal SQLAlchemy-specific state in attributes named with `_sa`,
            and those objects can't (and shouldn't be) serialized to JSON.
            """
        ),
    ] = True,
) -> Any:
    """
    Convert any object to something that can be encoded in JSON.

    This is used internally by FastAPI to make sure anything you return can be
    encoded as JSON before it is sent to the client.

    You can also use it yourself, for example to convert objects before saving them
    in a database that supports only JSON.

    Read more about it in the
    [FastAPI docs for JSON Compatible Encoder](https://fastapi.tiangolo.com/tutorial/encoder/).
    """
    custom_encoder = custom_encoder or {}
    if custom_encoder:
        if type(obj) in custom_encoder:
            return custom_encoder[type(obj)](obj)
        else:
            for encoder_type, encoder_instance in custom_encoder.items():
                if isinstance(obj, encoder_type):
                    return encoder_instance(obj)
    if include is not None and not isinstance(include, (set, dict)):
        include = set(include)
    if exclude is not None and not isinstance(exclude, (set, dict)):
        exclude = set(exclude)
    if isinstance(obj, BaseModel):
        obj_dict = obj.model_dump(
            mode="json",
            include=include,
            exclude=exclude,
            by_alias=by_alias,
            exclude_unset=exclude_unset,
            exclude_none=exclude_none,
            exclude_defaults=exclude_defaults,
        )
        return jsonable_encoder(
            obj_dict,
            exclude_none=exclude_none,
            exclude_defaults=exclude_defaults,
            sqlalchemy_safe=sqlalchemy_safe,
        )
    if dataclasses.is_dataclass(obj):
        assert not isinstance(obj, type)
        obj_dict = dataclasses.asdict(obj)
        return jsonable_encoder(
            obj_dict,
            include=include,
            exclude=exclude,
            by_alias=by_alias,
            exclude_unset=exclude_unset,
            exclude_defaults=exclude_defaults,
            exclude_none=exclude_none,
            custom_encoder=custom_encoder,
            sqlalchemy_safe=sqlalchemy_safe,
        )
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, PurePath):
        return str(obj)
    if isinstance(obj, (str, int, float, type(None))):
        return obj
    if isinstance(obj, PydanticUndefinedType):
        return None
    if isinstance(obj, dict):
        encoded_dict = {}
        allowed_keys = set(obj.keys())
        if include is not None:
            allowed_keys &= set(include)
        if exclude is not None:
            allowed_keys -= set(exclude)
        for key, value in obj.items():
            if (
                (
                    not sqlalchemy_safe
                    or (not isinstance(key, str))
                    or (not key.startswith("_sa"))
                )
                and (value is not None or not exclude_none)
                and key in allowed_keys
            ):
                encoded_key = jsonable_encoder(
                    key,
                    by_alias=by_alias,
                    exclude_unset=exclude_unset,
                    exclude_none=exclude_none,
                    custom_encoder=custom_encoder,
                    sqlalchemy_safe=sqlalchemy_safe,
                )
                encoded_value = jsonable_encoder(
                    value,
                    by_alias=by_alias,
                    exclude_unset=exclude_unset,
                    exclude_none=exclude_none,
                    custom_encoder=custom_encoder,
                    sqlalchemy_safe=sqlalchemy_safe,
                )
                encoded_dict[encoded_key] = encoded_value
        return encoded_dict
    if isinstance(obj, (list, set, frozenset, GeneratorType, tuple, deque)):
        encoded_list = []
        for item in obj:
            encoded_list.append(
                jsonable_encoder(
                    item,
                    include=include,
                    exclude=exclude,
                    by_alias=by_alias,
                    exclude_unset=exclude_unset,
                    exclude_defaults=exclude_defaults,
                    exclude_none=exclude_none,
                    custom_encoder=custom_encoder,
                    sqlalchemy_safe=sqlalchemy_safe,
                )
            )
        return encoded_list

    if type(obj) in ENCODERS_BY_TYPE:
        return ENCODERS_BY_TYPE[type(obj)](obj)
    for encoder, classes_tuple in encoders_by_class_tuples.items():
        if isinstance(obj, classes_tuple):
            return encoder(obj)
    if is_pydantic_v1_model_instance(obj):
        raise PydanticV1NotSupportedError(
            "pydantic.v1 models are no longer supported by FastAPI."
            f" Please update the model {obj!r}."
        )
    try:
        data = dict(obj)
    except Exception as e:
        errors: list[Exception] = []
        errors.append(e)
        try:
            data = vars(obj)
        except Exception as e:
            errors.append(e)
            raise ValueError(errors) from e
    return jsonable_encoder(
        data,
        include=include,
        exclude=exclude,
        by_alias=by_alias,
        exclude_unset=exclude_unset,
        exclude_defaults=exclude_defaults,
        exclude_none=exclude_none,
        custom_encoder=custom_encoder,
        sqlalchemy_safe=sqlalchemy_safe,
    )
```

---

## Background Tasks - BackgroundTasks¶

**URL:** https://fastapi.tiangolo.com/reference/background/

**Contents:**
- Background Tasks - BackgroundTasks¶
- fastapi.BackgroundTasks ¶
    - Example¶
  - func instance-attribute ¶
  - args instance-attribute ¶
  - kwargs instance-attribute ¶
  - is_async instance-attribute ¶
  - tasks instance-attribute ¶
  - add_task ¶

You can declare a parameter in a path operation function or dependency function with the type BackgroundTasks, and then you can use it to schedule the execution of background tasks after the response is sent.

You can import it directly from fastapi:

Bases: BackgroundTasks

A collection of background tasks that will be called after a response has been sent to the client.

Read more about it in the FastAPI docs for Background Tasks.

Add a function to be called in the background after the response is sent.

Read more about it in the FastAPI docs for Background Tasks.

The function to call after the response is sent.

It can be a regular def function or an async def function.

TYPE: Callable[P, Any]

**Examples:**

Example 1 (python):
```python
from fastapi import BackgroundTasks
```

Example 2 (rust):
```rust
BackgroundTasks(tasks=None)
```

Example 3 (python):
```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


def write_notification(email: str, message=""):
    with open("log.txt", mode="w") as email_file:
        content = f"notification for {email}: {message}"
        email_file.write(content)


@app.post("/send-notification/{email}")
async def send_notification(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(write_notification, email, message="some notification")
    return {"message": "Notification sent in the background"}
```

Example 4 (python):
```python
def __init__(self, tasks: Sequence[BackgroundTask] | None = None):
    self.tasks = list(tasks) if tasks else []
```

---

## WebSockets¶

**URL:** https://fastapi.tiangolo.com/reference/websockets/

**Contents:**
- WebSockets¶
- fastapi.WebSocket ¶
  - scope instance-attribute ¶
  - app property ¶
  - url property ¶
  - base_url property ¶
  - headers property ¶
  - query_params property ¶
  - path_params property ¶
  - cookies property ¶

When defining WebSockets, you normally declare a parameter of type WebSocket and with it you can read data from the client and send data to it.

It is provided directly by Starlette, but you can import it from fastapi:

When you want to define dependencies that should be compatible with both HTTP and WebSockets, you can define a parameter that takes an HTTPConnection instead of a Request or a WebSocket.

Bases: HTTPConnection

Receive ASGI websocket messages, ensuring valid state transitions.

Send ASGI websocket messages, ensuring valid state transitions.

When a client disconnects, a WebSocketDisconnect exception is raised, you can catch it.

You can import it directly form fastapi:

Additional classes for handling WebSockets.

Provided directly by Starlette, but you can import it from fastapi:

**Examples:**

Example 1 (python):
```python
from fastapi import WebSocket
```

Example 2 (unknown):
```unknown
WebSocket(scope, receive, send)
```

Example 3 (python):
```python
def __init__(self, scope: Scope, receive: Receive, send: Send) -> None:
    super().__init__(scope)
    assert scope["type"] == "websocket"
    self._receive = receive
    self._send = send
    self.client_state = WebSocketState.CONNECTING
    self.application_state = WebSocketState.CONNECTING
```

Example 4 (unknown):
```unknown
scope = scope
```

---

## OpenAPI docs¶

**URL:** https://fastapi.tiangolo.com/reference/openapi/docs/

**Contents:**
- OpenAPI docs¶
- fastapi.openapi.docs.get_swagger_ui_html ¶
- fastapi.openapi.docs.get_redoc_html ¶
- fastapi.openapi.docs.get_swagger_ui_oauth2_redirect_html ¶
- fastapi.openapi.docs.swagger_ui_default_parameters module-attribute ¶

Utilities to handle OpenAPI automatic UI documentation, including Swagger UI (by default at /docs) and ReDoc (by default at /redoc).

Generate and return the HTML that loads Swagger UI for the interactive API docs (normally served at /docs).

You would only call this function yourself if you needed to override some parts, for example the URLs to use to load Swagger UI's JavaScript and CSS.

Read more about it in the FastAPI docs for Configure Swagger UI and the FastAPI docs for Custom Docs UI Static Assets (Self-Hosting).

The OpenAPI URL that Swagger UI should load and use.

This is normally done automatically by FastAPI using the default URL /openapi.json.

The HTML <title> content, normally shown in the browser tab.

The URL to use to load the Swagger UI JavaScript.

It is normally set to a CDN URL.

TYPE: str DEFAULT: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js'

The URL to use to load the Swagger UI CSS.

It is normally set to a CDN URL.

TYPE: str DEFAULT: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css'

The URL of the favicon to use. It is normally shown in the browser tab.

TYPE: str DEFAULT: 'https://fastapi.tiangolo.com/img/favicon.png'

The OAuth2 redirect URL, it is normally automatically handled by FastAPI.

TYPE: Optional[str] DEFAULT: None

A dictionary with Swagger UI OAuth2 initialization configurations.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Configuration parameters for Swagger UI.

It defaults to swagger_ui_default_parameters.

TYPE: Optional[dict[str, Any]] DEFAULT: None

Generate and return the HTML response that loads ReDoc for the alternative API docs (normally served at /redoc).

You would only call this function yourself if you needed to override some parts, for example the URLs to use to load ReDoc's JavaScript and CSS.

Read more about it in the FastAPI docs for Custom Docs UI Static Assets (Self-Hosting).

The OpenAPI URL that ReDoc should load and use.

This is normally done automatically by FastAPI using the default URL /openapi.json.

The HTML <title> content, normally shown in the browser tab.

The URL to use to load the ReDoc JavaScript.

It is normally set to a CDN URL.

TYPE: str DEFAULT: 'https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js'

The URL of the favicon to use. It is normally shown in the browser tab.

TYPE: str DEFAULT: 'https://fastapi.tiangolo.com/img/favicon.png'

Load and use Google Fonts.

TYPE: bool DEFAULT: True

Generate the HTML response with the OAuth2 redirection for Swagger UI.

You normally don't need to use or change this.

Default configurations for Swagger UI.

You can use it as a template to add any other configurations needed.

**Examples:**

Example 1 (rust):
```rust
get_swagger_ui_html(
    *,
    openapi_url,
    title,
    swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
    swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
    oauth2_redirect_url=None,
    init_oauth=None,
    swagger_ui_parameters=None
)
```

Example 2 (html):
```html
def get_swagger_ui_html(
    *,
    openapi_url: Annotated[
        str,
        Doc(
            """
            The OpenAPI URL that Swagger UI should load and use.

            This is normally done automatically by FastAPI using the default URL
            `/openapi.json`.
            """
        ),
    ],
    title: Annotated[
        str,
        Doc(
            """
            The HTML `<title>` content, normally shown in the browser tab.
            """
        ),
    ],
    swagger_js_url: Annotated[
        str,
        Doc(
            """
            The URL to use to load the Swagger UI JavaScript.

            It is normally set to a CDN URL.
            """
        ),
    ] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
    swagger_css_url: Annotated[
        str,
        Doc(
            """
            The URL to use to load the Swagger UI CSS.

            It is normally set to a CDN URL.
            """
        ),
    ] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    swagger_favicon_url: Annotated[
        str,
        Doc(
            """
            The URL of the favicon to use. It is normally shown in the browser tab.
            """
        ),
    ] = "https://fastapi.tiangolo.com/img/favicon.png",
    oauth2_redirect_url: Annotated[
        Optional[str],
        Doc(
            """
            The OAuth2 redirect URL, it is normally automatically handled by FastAPI.
            """
        ),
    ] = None,
    init_oauth: Annotated[
        Optional[dict[str, Any]],
        Doc(
            """
            A dictionary with Swagger UI OAuth2 initialization configurations.
            """
        ),
    ] = None,
    swagger_ui_parameters: Annotated[
        Optional[dict[str, Any]],
        Doc(
            """
            Configuration parameters for Swagger UI.

            It defaults to [swagger_ui_default_parameters][fastapi.openapi.docs.swagger_ui_default_parameters].
            """
        ),
    ] = None,
) -> HTMLResponse:
    """
    Generate and return the HTML  that loads Swagger UI for the interactive
    API docs (normally served at `/docs`).

    You would only call this function yourself if you needed to override some parts,
    for example the URLs to use to load Swagger UI's JavaScript and CSS.

    Read more about it in the
    [FastAPI docs for Configure Swagger UI](https://fastapi.tiangolo.com/how-to/configure-swagger-ui/)
    and the [FastAPI docs for Custom Docs UI Static Assets (Self-Hosting)](https://fastapi.tiangolo.com/how-to/custom-docs-ui-assets/).
    """
    current_swagger_ui_parameters = swagger_ui_default_parameters.copy()
    if swagger_ui_parameters:
        current_swagger_ui_parameters.update(swagger_ui_parameters)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <link type="text/css" rel="stylesheet" href="{swagger_css_url}">
    <link rel="shortcut icon" href="{swagger_favicon_url}">
    <title>{title}</title>
    </head>
    <body>
    <div id="swagger-ui">
    </div>
    <script src="{swagger_js_url}"></script>
    <!-- `SwaggerUIBundle` is now available on the page -->
    <script>
    const ui = SwaggerUIBundle({{
        url: '{openapi_url}',
    """

    for key, value in current_swagger_ui_parameters.items():
        html += f"{json.dumps(key)}: {json.dumps(jsonable_encoder(value))},\n"

    if oauth2_redirect_url:
        html += f"oauth2RedirectUrl: window.location.origin + '{oauth2_redirect_url}',"

    html += """
    presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
    })"""

    if init_oauth:
        html += f"""
        ui.initOAuth({json.dumps(jsonable_encoder(init_oauth))})
        """

    html += """
    </script>
    </body>
    </html>
    """
    return HTMLResponse(html)
```

Example 3 (python):
```python
get_redoc_html(
    *,
    openapi_url,
    title,
    redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js",
    redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
    with_google_fonts=True
)
```

Example 4 (html):
```html
def get_redoc_html(
    *,
    openapi_url: Annotated[
        str,
        Doc(
            """
            The OpenAPI URL that ReDoc should load and use.

            This is normally done automatically by FastAPI using the default URL
            `/openapi.json`.
            """
        ),
    ],
    title: Annotated[
        str,
        Doc(
            """
            The HTML `<title>` content, normally shown in the browser tab.
            """
        ),
    ],
    redoc_js_url: Annotated[
        str,
        Doc(
            """
            The URL to use to load the ReDoc JavaScript.

            It is normally set to a CDN URL.
            """
        ),
    ] = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js",
    redoc_favicon_url: Annotated[
        str,
        Doc(
            """
            The URL of the favicon to use. It is normally shown in the browser tab.
            """
        ),
    ] = "https://fastapi.tiangolo.com/img/favicon.png",
    with_google_fonts: Annotated[
        bool,
        Doc(
            """
            Load and use Google Fonts.
            """
        ),
    ] = True,
) -> HTMLResponse:
    """
    Generate and return the HTML response that loads ReDoc for the alternative
    API docs (normally served at `/redoc`).

    You would only call this function yourself if you needed to override some parts,
    for example the URLs to use to load ReDoc's JavaScript and CSS.

    Read more about it in the
    [FastAPI docs for Custom Docs UI Static Assets (Self-Hosting)](https://fastapi.tiangolo.com/how-to/custom-docs-ui-assets/).
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <title>{title}</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    """
    if with_google_fonts:
        html += """
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    """
    html += f"""
    <link rel="shortcut icon" href="{redoc_favicon_url}">
    <!--
    ReDoc doesn't change outer page styles
    -->
    <style>
      body {{
        margin: 0;
        padding: 0;
      }}
    </style>
    </head>
    <body>
    <noscript>
        ReDoc requires Javascript to function. Please enable it to browse the documentation.
    </noscript>
    <redoc spec-url="{openapi_url}"></redoc>
    <script src="{redoc_js_url}"> </script>
    </body>
    </html>
    """
    return HTMLResponse(html)
```

---

## OpenAPI¶

**URL:** https://fastapi.tiangolo.com/reference/openapi/

**Contents:**
- OpenAPI¶

There are several utilities to handle OpenAPI.

You normally don't need to use them unless you have a specific advanced use case that requires it.

---

## Status Codes¶

**URL:** https://fastapi.tiangolo.com/reference/status/

**Contents:**
- Status Codes¶
- Example¶
- fastapi.status ¶
  - HTTP_100_CONTINUE module-attribute ¶
  - HTTP_101_SWITCHING_PROTOCOLS module-attribute ¶
  - HTTP_102_PROCESSING module-attribute ¶
  - HTTP_103_EARLY_HINTS module-attribute ¶
  - HTTP_200_OK module-attribute ¶
  - HTTP_201_CREATED module-attribute ¶
  - HTTP_202_ACCEPTED module-attribute ¶

You can import the status module from fastapi:

status is provided directly by Starlette.

It contains a group of named constants (variables) with integer status codes.

It can be convenient to quickly access HTTP (and WebSocket) status codes in your app, using autocompletion for the name without having to remember the integer status codes by memory.

Read more about it in the FastAPI docs about Response Status Code.

HTTP codes See HTTP Status Code Registry: https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml

And RFC 9110 - https://www.rfc-editor.org/rfc/rfc9110

WebSocket codes https://www.iana.org/assignments/websocket/websocket.xml#close-code-number https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent

**Examples:**

Example 1 (python):
```python
from fastapi import status
```

Example 2 (python):
```python
from fastapi import FastAPI, status

app = FastAPI()


@app.get("/items/", status_code=status.HTTP_418_IM_A_TEAPOT)
def read_items():
    return [{"name": "Plumbus"}, {"name": "Portal Gun"}]
```

Example 3 (unknown):
```unknown
HTTP_100_CONTINUE = 100
```

Example 4 (unknown):
```unknown
HTTP_101_SWITCHING_PROTOCOLS = 101
```

---

## Reference¶

**URL:** https://fastapi.tiangolo.com/reference/

**Contents:**
- Reference¶

Here's the reference or code API, the classes, functions, parameters, attributes, and all the FastAPI parts you can use in your applications.

If you want to learn FastAPI you are much better off reading the FastAPI Tutorial.

---

## UploadFile class¶

**URL:** https://fastapi.tiangolo.com/reference/uploadfile/

**Contents:**
- UploadFile class¶
- fastapi.UploadFile ¶
    - Example¶
  - file instance-attribute ¶
  - filename instance-attribute ¶
  - size instance-attribute ¶
  - headers instance-attribute ¶
  - content_type instance-attribute ¶
  - read async ¶
  - write async ¶

You can define path operation function parameters to be of the type UploadFile to receive files from the request.

You can import it directly from fastapi:

A file uploaded in a request.

Define it as a path operation function (or dependency) parameter.

If you are using a regular def function, you can use the upload_file.file attribute to access the raw standard Python file (blocking, not async), useful and needed for non-async code.

Read more about it in the FastAPI docs for Request Files.

The standard Python file object (non-async).

The original file name.

The size of the file in bytes.

The headers of the request.

The content type of the request, from the headers.

Read some bytes from the file.

To be awaitable, compatible with async, this is run in threadpool.

The number of bytes to read from the file.

TYPE: int DEFAULT: -1

Write some bytes to the file.

You normally wouldn't use this from a file you read in a request.

To be awaitable, compatible with async, this is run in threadpool.

The bytes to write to the file.

Move to a position in the file.

Any next read or write will be done from that position.

To be awaitable, compatible with async, this is run in threadpool.

The position in bytes to seek to in the file.

To be awaitable, compatible with async, this is run in threadpool.

**Examples:**

Example 1 (python):
```python
from fastapi import UploadFile
```

Example 2 (rust):
```rust
UploadFile(file, *, size=None, filename=None, headers=None)
```

Example 3 (python):
```python
from typing import Annotated

from fastapi import FastAPI, File, UploadFile

app = FastAPI()


@app.post("/files/")
async def create_file(file: Annotated[bytes, File()]):
    return {"file_size": len(file)}


@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    return {"filename": file.filename}
```

Example 4 (python):
```python
def __init__(
    self,
    file: BinaryIO,
    *,
    size: int | None = None,
    filename: str | None = None,
    headers: Headers | None = None,
) -> None:
    self.filename = filename
    self.file = file
    self.size = size
    self.headers = headers or Headers()

    # Capture max size from SpooledTemporaryFile if one is provided. This slightly speeds up future checks.
    # Note 0 means unlimited mirroring SpooledTemporaryFile's __init__
    self._max_mem_size = getattr(self.file, "_max_size", 0)
```

---

## Templating - Jinja2Templates¶

**URL:** https://fastapi.tiangolo.com/reference/templating/

**Contents:**
- Templating - Jinja2Templates¶
- fastapi.templating.Jinja2Templates ¶
  - context_processors instance-attribute ¶
  - env instance-attribute ¶
  - get_template ¶
  - TemplateResponse ¶

You can use the Jinja2Templates class to render Jinja templates.

Read more about it in the FastAPI docs for Templates.

You can import it directly from fastapi.templating:

templates = Jinja2Templates("templates")

return templates.TemplateResponse("index.html", {"request": request})

**Examples:**

Example 1 (sql):
```sql
from fastapi.templating import Jinja2Templates
```

Example 2 (rust):
```rust
Jinja2Templates(
    directory: (
        str | PathLike[str] | Sequence[str | PathLike[str]]
    ),
    *,
    context_processors: (
        list[Callable[[Request], dict[str, Any]]] | None
    ) = None,
    **env_options: Any
)
```

Example 3 (rust):
```rust
Jinja2Templates(
    *,
    env: Environment,
    context_processors: (
        list[Callable[[Request], dict[str, Any]]] | None
    ) = None
)
```

Example 4 (rust):
```rust
Jinja2Templates(
    directory=None,
    *,
    context_processors=None,
    env=None,
    **env_options
)
```

---

## Static Files - StaticFiles¶

**URL:** https://fastapi.tiangolo.com/reference/staticfiles/

**Contents:**
- Static Files - StaticFiles¶
- fastapi.staticfiles.StaticFiles ¶
  - directory instance-attribute ¶
  - packages instance-attribute ¶
  - all_directories instance-attribute ¶
  - html instance-attribute ¶
  - config_checked instance-attribute ¶
  - follow_symlink instance-attribute ¶
  - get_directories ¶
  - get_path ¶

You can use the StaticFiles class to serve static files, like JavaScript, CSS, images, etc.

Read more about it in the FastAPI docs for Static Files.

You can import it directly from fastapi.staticfiles:

Given directory and packages arguments, return a list of all the directories that should be used for serving static files from.

Given the ASGI scope, return the path string to serve up, with OS specific path separators, and any '..', '.' components removed.

Returns an HTTP response, given the incoming path, method and request headers.

Perform a one-off configuration check that StaticFiles is actually pointed at a directory, so that we can raise loud errors rather than just returning 404 responses.

Given the request and response headers, return True if an HTTP "Not Modified" response could be returned instead.

**Examples:**

Example 1 (sql):
```sql
from fastapi.staticfiles import StaticFiles
```

Example 2 (rust):
```rust
StaticFiles(
    *,
    directory=None,
    packages=None,
    html=False,
    check_dir=True,
    follow_symlink=False
)
```

Example 3 (python):
```python
def __init__(
    self,
    *,
    directory: PathLike | None = None,
    packages: list[str | tuple[str, str]] | None = None,
    html: bool = False,
    check_dir: bool = True,
    follow_symlink: bool = False,
) -> None:
    self.directory = directory
    self.packages = packages
    self.all_directories = self.get_directories(directory, packages)
    self.html = html
    self.config_checked = False
    self.follow_symlink = follow_symlink
    if check_dir and directory is not None and not os.path.isdir(directory):
        raise RuntimeError(f"Directory '{directory}' does not exist")
```

Example 4 (unknown):
```unknown
directory = directory
```

---

## Custom Response Classes - File, HTML, Redirect, Streaming, etc.¶

**URL:** https://fastapi.tiangolo.com/reference/responses/

**Contents:**
- Custom Response Classes - File, HTML, Redirect, Streaming, etc.¶
- FastAPI Responses¶
- fastapi.responses.UJSONResponse ¶
  - charset class-attribute instance-attribute ¶
  - status_code instance-attribute ¶
  - media_type class-attribute instance-attribute ¶
  - body instance-attribute ¶
  - background instance-attribute ¶
  - headers property ¶
  - render ¶

There are several custom response classes you can use to create an instance and return them directly from your path operations.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

You can import them directly from fastapi.responses:

There are a couple of custom FastAPI response classes, you can use them to optimize JSON performance.

JSON response using the high-performance ujson library to serialize data to JSON.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

JSON response using the high-performance orjson library to serialize data to JSON.

Read more about it in the FastAPI docs for Custom Response - HTML, Stream, File, others.

**Examples:**

Example 1 (sql):
```sql
from fastapi.responses import (
    FileResponse,
    HTMLResponse,
    JSONResponse,
    ORJSONResponse,
    PlainTextResponse,
    RedirectResponse,
    Response,
    StreamingResponse,
    UJSONResponse,
)
```

Example 2 (rust):
```rust
UJSONResponse(
    content,
    status_code=200,
    headers=None,
    media_type=None,
    background=None,
)
```

Example 3 (python):
```python
def __init__(
    self,
    content: Any,
    status_code: int = 200,
    headers: Mapping[str, str] | None = None,
    media_type: str | None = None,
    background: BackgroundTask | None = None,
) -> None:
    super().__init__(content, status_code, headers, media_type, background)
```

Example 4 (unknown):
```unknown
charset = 'utf-8'
```

---

## Request Parameters¶

**URL:** https://fastapi.tiangolo.com/reference/parameters/

**Contents:**
- Request Parameters¶
- fastapi.Query ¶
- fastapi.Path ¶
- fastapi.Body ¶
- fastapi.Cookie ¶
- fastapi.Header ¶
- fastapi.Form ¶
- fastapi.File ¶

Here's the reference information for the request parameters.

These are the special functions that you can put in path operation function parameters or dependency functions with Annotated to get data from the request.

You can import them all directly from fastapi:

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Declare a path parameter for a path operation.

Read more about it in the FastAPI docs for Path Parameters and Numeric Validations.

Default value if the parameter field is not set.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Any DEFAULT: ...

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

When embed is True, the parameter will be expected in a JSON body as a key instead of being the JSON body itself.

This happens automatically when more than one Body parameter is declared.

Read more about it in the FastAPI docs for Body - Multiple Parameters.

TYPE: Union[bool, None] DEFAULT: None

The media type of this parameter field. Changing it would affect the generated OpenAPI, but currently it doesn't affect the parsing of the data.

TYPE: str DEFAULT: 'application/json'

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Automatically convert underscores to hyphens in the parameter field name.

Read more about it in the FastAPI docs for Header Parameters

TYPE: bool DEFAULT: True

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

The media type of this parameter field. Changing it would affect the generated OpenAPI, but currently it doesn't affect the parsing of the data.

TYPE: str DEFAULT: 'application/x-www-form-urlencoded'

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

Default value if the parameter field is not set.

TYPE: Any DEFAULT: Undefined

A callable to generate the default value.

This doesn't affect Path parameters as the value is always required. The parameter is available only for compatibility.

TYPE: Union[Callable[[], Any], None] DEFAULT: _Unset

The media type of this parameter field. Changing it would affect the generated OpenAPI, but currently it doesn't affect the parsing of the data.

TYPE: str DEFAULT: 'multipart/form-data'

An alternative name for the parameter field.

This will be used to extract the data and for the generated OpenAPI. It is particularly useful when you can't use the name you want because it is a Python reserved keyword or similar.

TYPE: Optional[str] DEFAULT: None

Priority of the alias. This affects whether an alias generator is used.

TYPE: Union[int, None] DEFAULT: _Unset

'Whitelist' validation step. The parameter field will be the single one allowed by the alias or set of aliases defined.

TYPE: Union[str, AliasPath, AliasChoices, None] DEFAULT: None

'Blacklist' validation step. The vanilla parameter field will be the single one of the alias' or set of aliases' fields and all the other fields will be ignored at serialization time.

TYPE: Union[str, None] DEFAULT: None

Human-readable title.

TYPE: Optional[str] DEFAULT: None

Human-readable description.

TYPE: Optional[str] DEFAULT: None

Greater than. If set, value must be greater than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Greater than or equal. If set, value must be greater than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than. If set, value must be less than this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Less than or equal. If set, value must be less than or equal to this. Only applicable to numbers.

TYPE: Optional[float] DEFAULT: None

Minimum length for strings.

TYPE: Optional[int] DEFAULT: None

Maximum length for strings.

TYPE: Optional[int] DEFAULT: None

RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Deprecated in FastAPI 0.100.0 and Pydantic v2, use pattern instead. RegEx pattern for strings.

TYPE: Optional[str] DEFAULT: None

Parameter field name for discriminating the type in a tagged union.

TYPE: Union[str, None] DEFAULT: None

If True, strict validation is applied to the field.

TYPE: Union[bool, None] DEFAULT: _Unset

Value must be a multiple of this. Only applicable to numbers.

TYPE: Union[float, None] DEFAULT: _Unset

Allow inf, -inf, nan. Only applicable to numbers.

TYPE: Union[bool, None] DEFAULT: _Unset

Maximum number of allow digits for strings.

TYPE: Union[int, None] DEFAULT: _Unset

Maximum number of decimal places allowed for numbers.

TYPE: Union[int, None] DEFAULT: _Unset

Example values for this field.

TYPE: Optional[list[Any]] DEFAULT: None

Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, although still supported. Use examples instead.

TYPE: Optional[Any] DEFAULT: _Unset

OpenAPI-specific examples.

It will be added to the generated OpenAPI (e.g. visible at /docs).

Swagger UI (that provides the /docs interface) has better support for the OpenAPI-specific examples than the JSON Schema examples, that's the main use case for this.

Read more about it in the FastAPI docs for Declare Request Example Data.

TYPE: Optional[dict[str, Example]] DEFAULT: None

Mark this parameter field as deprecated.

It will affect the generated OpenAPI (e.g. visible at /docs).

TYPE: Union[deprecated, str, bool, None] DEFAULT: None

To include (or not) this parameter field in the generated OpenAPI. You probably don't need it, but it's available.

This affects the generated OpenAPI (e.g. visible at /docs).

TYPE: bool DEFAULT: True

Any additional JSON schema data.

TYPE: Union[dict[str, Any], None] DEFAULT: None

The extra kwargs is deprecated. Use json_schema_extra instead. Include extra fields used by the JSON Schema.

TYPE: Any DEFAULT: {}

**Examples:**

Example 1 (python):
```python
from fastapi import Body, Cookie, File, Form, Header, Path, Query
```

Example 2 (rust):
```rust
Query(
    default=Undefined,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    min_length=None,
    max_length=None,
    pattern=None,
    regex=None,
    discriminator=None,
    strict=_Unset,
    multiple_of=_Unset,
    allow_inf_nan=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
    include_in_schema=True,
    json_schema_extra=None,
    **extra
)
```

Example 3 (python):
```python
def Query(  # noqa: N802
    default: Annotated[
        Any,
        Doc(
            """
            Default value if the parameter field is not set.
            """
        ),
    ] = Undefined,
    *,
    default_factory: Annotated[
        Union[Callable[[], Any], None],
        Doc(
            """
            A callable to generate the default value.

            This doesn't affect `Path` parameters as the value is always required.
            The parameter is available only for compatibility.
            """
        ),
    ] = _Unset,
    alias: Annotated[
        Optional[str],
        Doc(
            """
            An alternative name for the parameter field.

            This will be used to extract the data and for the generated OpenAPI.
            It is particularly useful when you can't use the name you want because it
            is a Python reserved keyword or similar.
            """
        ),
    ] = None,
    alias_priority: Annotated[
        Union[int, None],
        Doc(
            """
            Priority of the alias. This affects whether an alias generator is used.
            """
        ),
    ] = _Unset,
    validation_alias: Annotated[
        Union[str, AliasPath, AliasChoices, None],
        Doc(
            """
            'Whitelist' validation step. The parameter field will be the single one
            allowed by the alias or set of aliases defined.
            """
        ),
    ] = None,
    serialization_alias: Annotated[
        Union[str, None],
        Doc(
            """
            'Blacklist' validation step. The vanilla parameter field will be the
            single one of the alias' or set of aliases' fields and all the other
            fields will be ignored at serialization time.
            """
        ),
    ] = None,
    title: Annotated[
        Optional[str],
        Doc(
            """
            Human-readable title.
            """
        ),
    ] = None,
    description: Annotated[
        Optional[str],
        Doc(
            """
            Human-readable description.
            """
        ),
    ] = None,
    gt: Annotated[
        Optional[float],
        Doc(
            """
            Greater than. If set, value must be greater than this. Only applicable to
            numbers.
            """
        ),
    ] = None,
    ge: Annotated[
        Optional[float],
        Doc(
            """
            Greater than or equal. If set, value must be greater than or equal to
            this. Only applicable to numbers.
            """
        ),
    ] = None,
    lt: Annotated[
        Optional[float],
        Doc(
            """
            Less than. If set, value must be less than this. Only applicable to numbers.
            """
        ),
    ] = None,
    le: Annotated[
        Optional[float],
        Doc(
            """
            Less than or equal. If set, value must be less than or equal to this.
            Only applicable to numbers.
            """
        ),
    ] = None,
    min_length: Annotated[
        Optional[int],
        Doc(
            """
            Minimum length for strings.
            """
        ),
    ] = None,
    max_length: Annotated[
        Optional[int],
        Doc(
            """
            Maximum length for strings.
            """
        ),
    ] = None,
    pattern: Annotated[
        Optional[str],
        Doc(
            """
            RegEx pattern for strings.
            """
        ),
    ] = None,
    regex: Annotated[
        Optional[str],
        Doc(
            """
            RegEx pattern for strings.
            """
        ),
        deprecated(
            "Deprecated in FastAPI 0.100.0 and Pydantic v2, use `pattern` instead."
        ),
    ] = None,
    discriminator: Annotated[
        Union[str, None],
        Doc(
            """
            Parameter field name for discriminating the type in a tagged union.
            """
        ),
    ] = None,
    strict: Annotated[
        Union[bool, None],
        Doc(
            """
            If `True`, strict validation is applied to the field.
            """
        ),
    ] = _Unset,
    multiple_of: Annotated[
        Union[float, None],
        Doc(
            """
            Value must be a multiple of this. Only applicable to numbers.
            """
        ),
    ] = _Unset,
    allow_inf_nan: Annotated[
        Union[bool, None],
        Doc(
            """
            Allow `inf`, `-inf`, `nan`. Only applicable to numbers.
            """
        ),
    ] = _Unset,
    max_digits: Annotated[
        Union[int, None],
        Doc(
            """
            Maximum number of allow digits for strings.
            """
        ),
    ] = _Unset,
    decimal_places: Annotated[
        Union[int, None],
        Doc(
            """
            Maximum number of decimal places allowed for numbers.
            """
        ),
    ] = _Unset,
    examples: Annotated[
        Optional[list[Any]],
        Doc(
            """
            Example values for this field.
            """
        ),
    ] = None,
    example: Annotated[
        Optional[Any],
        deprecated(
            "Deprecated in OpenAPI 3.1.0 that now uses JSON Schema 2020-12, "
            "although still supported. Use examples instead."
        ),
    ] = _Unset,
    openapi_examples: Annotated[
        Optional[dict[str, Example]],
        Doc(
            """
            OpenAPI-specific examples.

            It will be added to the generated OpenAPI (e.g. visible at `/docs`).

            Swagger UI (that provides the `/docs` interface) has better support for the
            OpenAPI-specific examples than the JSON Schema `examples`, that's the main
            use case for this.

            Read more about it in the
            [FastAPI docs for Declare Request Example Data](https://fastapi.tiangolo.com/tutorial/schema-extra-example/#using-the-openapi_examples-parameter).
            """
        ),
    ] = None,
    deprecated: Annotated[
        Union[deprecated, str, bool, None],
        Doc(
            """
            Mark this parameter field as deprecated.

            It will affect the generated OpenAPI (e.g. visible at `/docs`).
            """
        ),
    ] = None,
    include_in_schema: Annotated[
        bool,
        Doc(
            """
            To include (or not) this parameter field in the generated OpenAPI.
            You probably don't need it, but it's available.

            This affects the generated OpenAPI (e.g. visible at `/docs`).
            """
        ),
    ] = True,
    json_schema_extra: Annotated[
        Union[dict[str, Any], None],
        Doc(
            """
            Any additional JSON schema data.
            """
        ),
    ] = None,
    **extra: Annotated[
        Any,
        Doc(
            """
            Include extra fields used by the JSON Schema.
            """
        ),
        deprecated(
            """
            The `extra` kwargs is deprecated. Use `json_schema_extra` instead.
            """
        ),
    ],
) -> Any:
    return params.Query(
        default=default,
        default_factory=default_factory,
        alias=alias,
        alias_priority=alias_priority,
        validation_alias=validation_alias,
        serialization_alias=serialization_alias,
        title=title,
        description=description,
        gt=gt,
        ge=ge,
        lt=lt,
        le=le,
        min_length=min_length,
        max_length=max_length,
        pattern=pattern,
        regex=regex,
        discriminator=discriminator,
        strict=strict,
        multiple_of=multiple_of,
        allow_inf_nan=allow_inf_nan,
        max_digits=max_digits,
        decimal_places=decimal_places,
        example=example,
        examples=examples,
        openapi_examples=openapi_examples,
        deprecated=deprecated,
        include_in_schema=include_in_schema,
        json_schema_extra=json_schema_extra,
        **extra,
    )
```

Example 4 (rust):
```rust
Path(
    default=...,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    min_length=None,
    max_length=None,
    pattern=None,
    regex=None,
    discriminator=None,
    strict=_Unset,
    multiple_of=_Unset,
    allow_inf_nan=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
    include_in_schema=True,
    json_schema_extra=None,
    **extra
)
```

---

## Test Client - TestClient¶

**URL:** https://fastapi.tiangolo.com/reference/testclient/

**Contents:**
- Test Client - TestClient¶
- fastapi.testclient.TestClient ¶
  - headers property writable ¶
  - follow_redirects instance-attribute ¶
  - max_redirects instance-attribute ¶
  - is_closed property ¶
  - trust_env property ¶
  - timeout property writable ¶
  - event_hooks property writable ¶
  - auth property writable ¶

You can use the TestClient class to test FastAPI applications without creating an actual HTTP and socket connection, just communicating directly with the FastAPI code.

Read more about it in the FastAPI docs for Testing.

You can import it directly from fastapi.testclient:

HTTP headers to include when sending requests.

Check if the client being closed

Authentication class used when none is passed at the request-level.

See also Authentication.

Base URL to use when sending requests with relative URLs.

Cookie values to include when sending requests.

Query parameters to include in the URL when sending requests.

Build and return a request instance.

See also: Request instances

Alternative to httpx.request() that streams the response body instead of loading it into memory at once.

Parameters: See httpx.request.

See also: Streaming Responses

The request is sent as-is, unmodified.

Typically you'll want to build one with Client.build_request() so that any client-level configuration is merged into the request, but passing an explicit httpx.Request() is supported as well.

See also: Request instances

Close transport and proxies.

**Examples:**

Example 1 (sql):
```sql
from fastapi.testclient import TestClient
```

Example 2 (rust):
```rust
TestClient(
    app,
    base_url="http://testserver",
    raise_server_exceptions=True,
    root_path="",
    backend="asyncio",
    backend_options=None,
    cookies=None,
    headers=None,
    follow_redirects=True,
    client=("testclient", 50000),
)
```

Example 3 (python):
```python
def __init__(
    self,
    app: ASGIApp,
    base_url: str = "http://testserver",
    raise_server_exceptions: bool = True,
    root_path: str = "",
    backend: Literal["asyncio", "trio"] = "asyncio",
    backend_options: dict[str, Any] | None = None,
    cookies: httpx._types.CookieTypes | None = None,
    headers: dict[str, str] | None = None,
    follow_redirects: bool = True,
    client: tuple[str, int] = ("testclient", 50000),
) -> None:
    self.async_backend = _AsyncBackend(backend=backend, backend_options=backend_options or {})
    if _is_asgi3(app):
        asgi_app = app
    else:
        app = cast(ASGI2App, app)  # type: ignore[assignment]
        asgi_app = _WrapASGI2(app)  # type: ignore[arg-type]
    self.app = asgi_app
    self.app_state: dict[str, Any] = {}
    transport = _TestClientTransport(
        self.app,
        portal_factory=self._portal_factory,
        raise_server_exceptions=raise_server_exceptions,
        root_path=root_path,
        app_state=self.app_state,
        client=client,
    )
    if headers is None:
        headers = {}
    headers.setdefault("user-agent", "testclient")
    super().__init__(
        base_url=base_url,
        headers=headers,
        transport=transport,
        follow_redirects=follow_redirects,
        cookies=cookies,
    )
```

Example 4 (unknown):
```unknown
follow_redirects = follow_redirects
```

---

## Request class¶

**URL:** https://fastapi.tiangolo.com/reference/request/

**Contents:**
- Request class¶
- fastapi.Request ¶
  - scope instance-attribute ¶
  - app property ¶
  - url property ¶
  - base_url property ¶
  - headers property ¶
  - query_params property ¶
  - path_params property ¶
  - cookies property ¶

You can declare a parameter in a path operation function or dependency to be of type Request and then you can access the raw request object directly, without any validation, etc.

You can import it directly from fastapi:

When you want to define dependencies that should be compatible with both HTTP and WebSockets, you can define a parameter that takes an HTTPConnection instead of a Request or a WebSocket.

Bases: HTTPConnection

**Examples:**

Example 1 (python):
```python
from fastapi import Request
```

Example 2 (unknown):
```unknown
Request(scope, receive=empty_receive, send=empty_send)
```

Example 3 (python):
```python
def __init__(self, scope: Scope, receive: Receive = empty_receive, send: Send = empty_send):
    super().__init__(scope)
    assert scope["type"] == "http"
    self._receive = receive
    self._send = send
    self._stream_consumed = False
    self._is_disconnected = False
    self._form = None
```

Example 4 (unknown):
```unknown
scope = scope
```

---

## Response class¶

**URL:** https://fastapi.tiangolo.com/reference/response/

**Contents:**
- Response class¶
- fastapi.Response ¶
  - media_type class-attribute instance-attribute ¶
  - charset class-attribute instance-attribute ¶
  - status_code instance-attribute ¶
  - background instance-attribute ¶
  - body instance-attribute ¶
  - headers property ¶
  - render ¶
  - init_headers ¶

You can declare a parameter in a path operation function or dependency to be of type Response and then you can set data for the response like headers or cookies.

You can also use it directly to create an instance of it and return it from your path operations.

You can import it directly from fastapi:

**Examples:**

Example 1 (python):
```python
from fastapi import Response
```

Example 2 (rust):
```rust
Response(
    content=None,
    status_code=200,
    headers=None,
    media_type=None,
    background=None,
)
```

Example 3 (python):
```python
def __init__(
    self,
    content: Any = None,
    status_code: int = 200,
    headers: Mapping[str, str] | None = None,
    media_type: str | None = None,
    background: BackgroundTask | None = None,
) -> None:
    self.status_code = status_code
    if media_type is not None:
        self.media_type = media_type
    self.background = background
    self.body = self.render(content)
    self.init_headers(headers)
```

Example 4 (rust):
```rust
media_type = None
```

---

## Exceptions - HTTPException and WebSocketException¶

**URL:** https://fastapi.tiangolo.com/reference/exceptions/

**Contents:**
- Exceptions - HTTPException and WebSocketException¶
- fastapi.HTTPException ¶
    - Example¶
  - status_code instance-attribute ¶
  - detail instance-attribute ¶
  - headers instance-attribute ¶
- fastapi.WebSocketException ¶
    - Example¶
  - code instance-attribute ¶
  - reason instance-attribute ¶

These are the exceptions that you can raise to show errors to the client.

When you raise an exception, as would happen with normal Python, the rest of the execution is aborted. This way you can raise these exceptions from anywhere in the code to abort a request and show the error to the client.

These exceptions can be imported directly from fastapi:

An HTTP exception you can raise in your own code to show errors to the client.

This is for client errors, invalid authentication, invalid data, etc. Not for server errors in your code.

Read more about it in the FastAPI docs for Handling Errors.

HTTP status code to send to the client.

Any data to be sent to the client in the detail key of the JSON response.

TYPE: Any DEFAULT: None

Any headers to send to the client in the response.

TYPE: Optional[dict[str, str]] DEFAULT: None

Bases: WebSocketException

A WebSocket exception you can raise in your own code to show errors to the client.

This is for client errors, invalid authentication, invalid data, etc. Not for server errors in your code.

Read more about it in the FastAPI docs for WebSockets.

A closing code from the valid codes defined in the specification.

The reason to close the WebSocket connection.

It is UTF-8-encoded data. The interpretation of the reason is up to the application, it is not specified by the WebSocket specification.

It could contain text that could be human-readable or interpretable by the client code, etc.

TYPE: Union[str, None] DEFAULT: None

**Examples:**

Example 1 (python):
```python
from fastapi import HTTPException, WebSocketException
```

Example 2 (rust):
```rust
HTTPException(status_code, detail=None, headers=None)
```

Example 3 (python):
```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

items = {"foo": "The Foo Wrestlers"}


@app.get("/items/{item_id}")
async def read_item(item_id: str):
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"item": items[item_id]}
```

Example 4 (python):
```python
def __init__(
    self,
    status_code: Annotated[
        int,
        Doc(
            """
            HTTP status code to send to the client.
            """
        ),
    ],
    detail: Annotated[
        Any,
        Doc(
            """
            Any data to be sent to the client in the `detail` key of the JSON
            response.
            """
        ),
    ] = None,
    headers: Annotated[
        Optional[dict[str, str]],
        Doc(
            """
            Any headers to send to the client in the response.
            """
        ),
    ] = None,
) -> None:
    super().__init__(status_code=status_code, detail=detail, headers=headers)
```

---

## OpenAPI models¶

**URL:** https://fastapi.tiangolo.com/reference/openapi/models/

**Contents:**
- OpenAPI models¶
- fastapi.openapi.models ¶
  - SchemaType module-attribute ¶
  - SchemaOrBool module-attribute ¶
  - SecurityScheme module-attribute ¶
  - BaseModelWithConfig ¶
    - model_config class-attribute instance-attribute ¶
  - Contact ¶
    - name class-attribute instance-attribute ¶
    - url class-attribute instance-attribute ¶

OpenAPI Pydantic models used to generate and validate the generated OpenAPI.

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

Bases: BaseModelWithConfig

**Examples:**

Example 1 (unknown):
```unknown
SchemaType = Literal[
    "array",
    "boolean",
    "integer",
    "null",
    "number",
    "object",
    "string",
]
```

Example 2 (unknown):
```unknown
SchemaOrBool = Union[Schema, bool]
```

Example 3 (unknown):
```unknown
SecurityScheme = Union[
    APIKey, HTTPBase, OAuth2, OpenIdConnect, HTTPBearer
]
```

Example 4 (unknown):
```unknown
model_config = {'extra': 'allow'}
```

---
