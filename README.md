# Task notes - request-identifier

Based on the instructions I understood that the main goal was implement a method that can identify a URI with specific requirements and return its path and parameters, in the case that it is valid. This should then be supported by an object-oriented structure, where a client makes use of the class containing the method.

The part which took me the longest to implement was the library which I used to parse the URI. I wanted to use something I had not previously used in order to make the implementation as simple as possible, so I had to peek at the documentation, slowing the process down a little.

In terms of improvements to be made, the final implementation is quite verbose and could be compressed by joining statements. Edge cases of input URIs could also be handled more comprehensively with more time.
