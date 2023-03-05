from xmlrpc.server import SimpleXMLRPCServer
from xmlrpc.server import SimpleXMLRPCRequestHandler
import xml.etree.ElementTree as ET
import requests
import os

class XMLRPCServer(SimpleXMLRPCServer):
    pass

class RequestHandler(SimpleXMLRPCRequestHandler):
    pass

def addEntry(userNote):
    try:
        tree = ET.parse('output.xml')
        root = tree.getroot()
        
        note = ET.Element('note')
        note.attrib['name'] = userNote['note']

        text = ET.Element('text')
        text.text = userNote['text']

        timestamp = ET.Element('timestamp')
        timestamp.text = userNote['timestamp']

        note.append(text)
        note.append(timestamp)

        for child in root:
            if (child.attrib['name'] == userNote['topic']):
                child.append(note)
                tree.write('output.xml')
                return 0
            
        topic = ET.Element('topic')
        topic.attrib['name'] = userNote['topic']

        topic.append(note)
        root.append(topic)
        tree.write('output.xml')
        return 0
    except:
        return 1

def getEntries(topic):
    try:
        tree = ET.parse('output.xml')
        root = tree.getroot()
        results = []
        for child in root:
            if (child.attrib['name'] == topic):
                note = child.find('note')
                text = ''
                timestamp = ''
                text = note.find('text').text
                timestamp = note.find('timestamp').text
                results.append([
                    note.attrib['name'],
                    text,
                    timestamp
                ])
                return results
        return results
    except:
        return 1

def getWiki(term):
    try:
        S = requests.Session()
        URL = "https://en.wikipedia.org/w/api.php"
        PARAMS = {
            "action": "opensearch",
            "namespace": "0",
            "search": term,
            "limit": "10",
            "format": "json"
        }
        R = S.get(url=URL, params=PARAMS)
        DATA = R.json()
        link = "empty"
        
        if len(DATA) == 4:
            link = DATA[3][0]

        linkname = os.path.basename(link)
        name_without_extension = os.path.splitext(linkname)[0]
        last_word = name_without_extension.lower()
        
        content = getWikiContent(last_word)
    except:
        return 1
    return content

def getWikiContent(content_title):
    try:
        S = requests.Session()
        URL = "https://en.wikipedia.org/w/api.php"
        PARAMS = {
                "action": "query",
                "prop": "extracts",
                "exsentences": "10",
                "exlimit": "1",
                "titles": content_title,
                "explaintext": "1",
                "formatversion": "2",
                "format": "json"
            }
            
        R2 = S.get(url=URL, params=PARAMS)
        DATA2 = R2.json()
        PAGE = DATA2["query"]["pages"][0]["extract"]
    except:
        return 1
    return PAGE

if __name__ == "__main__":
    server = XMLRPCServer(('localhost', 8000), requestHandler=RequestHandler)
    print("Listening on port 8000...")

    server.register_function( addEntry )
    server.register_function( getEntries )
    server.register_function( getWiki )
    server.serve_forever()
