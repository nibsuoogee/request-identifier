from urllib.parse import urlparse
from urllib.parse import parse_qs

class Identifier:
    def __init__(self):
        pass

    def identify_request(self, URI: str):
        if not isinstance(URI, str):
            return 0
        parsed_uri = urlparse(URI)
        path = ""
        params = {}

        if parsed_uri.scheme != "visma-identity":
            return 0

        if (parsed_uri.netloc == "login"):
            path = "login"
            params = parse_qs(parsed_uri.query)

            try: # Require "source" parameter
                params["source"]
            except KeyError:
                return 0

            for key, value in params.items(): # Cast all params to string
                params[key] = str(value[0])

        elif (parsed_uri.netloc == "confirm"):
            path = "confirm"
            params = parse_qs(parsed_uri.query)

            try: # Require "source" and "paymentnumber" parameters
                params["source"]
                params["paymentnumber"]
            except KeyError:
                return 0  

            for key, value in params.items(): # Attempt to cast all params to int
                try:
                    params[key] = int(value[0])
                except ValueError: 
                    # Fail if parameter "paymentnumber" is not int castable
                    if key == "paymentnumber":
                        return 0
                    params[key] = str(value[0]) # cast other params to string

        elif (parsed_uri.netloc == "sign"):
            path = "sign"
            params = parse_qs(parsed_uri.query)

            try: # Require "source" and "documentid" parameters
                params["source"]
                params["documentid"]
            except KeyError:
                return 0

            for key, value in params.items(): # Cast all params to string
                params[key] = str(value[0])

        else: # Fail if path not "login", "confirm" or "sign"
            return 0
            
        result = {"path": path, "parameters": params}
        return result

class Client():
    def __init__(self):
        self.Identifier_instance = Identifier()

    def identify_uri(self, URI: str):
        data = self.Identifier_instance.identify_request(URI)
        # method returns data in the form {'path': 'value', 'parameters': {'': '', '': ''}}
        # or 0 if validation fails
        print(data)


if __name__ == "__main__":
    # Client using the identifier with example URIs and a few test cases
    client = Client()
    client.identify_uri("visma-identity://login?source=severa")
    client.identify_uri("visma-identity://confirm?source=netvisor&paymentnumber=102226")
    client.identify_uri("visma-identity://sign?source=vismasign&documentid=105ab44")
    client.identify_uri(1)
    client.identify_uri("")
    client.identify_uri(None)