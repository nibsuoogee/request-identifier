import xmlrpc.client
from datetime import datetime

class Client():
    def __init__(self):
        self.proxy = xmlrpc.client.ServerProxy("http://localhost:8000/")

    def newEntry(self):
        topic = input('Enter a topic: ')
        note = input('Enter a note: ')
        text = input('Enter text: ')
        timestamp = datetime.now().strftime("%d/%m/%y - %H:%M:%S")
        note = {
            "topic": topic,
            "note": note,
            "text": text,
            "timestamp": timestamp,
        }
        print(f"Adding to topic '{topic}'...")
        result = self.proxy.addEntry(note)
        if (result == 1):
            print("An error occured")
            return
        print(f"Entry added to topic '{topic}'.")
        return
    
    def searchTopic(self):
        topic = input('Search by topic: ')
        result = self.proxy.getEntries(topic)
        if result == 1:
            print("An error occured.")
            return
        if len(result) == 0:
            print("No current entries.")
        else:
            print(result)
        print(f"Searching for new information on topic '{topic}'...")
        result = self.proxy.getWiki(topic)
        print(result)
        appendChoice = input('Append the information to the database? (y/n): ')
        if (appendChoice == 'y'):
            note = input('Enter a note: ')
            text = result
            timestamp = datetime.now().strftime("%d/%m/%y - %H:%M:%S")
            note = {
                "topic": topic,
                "note": note,
                "text": text,
                "timestamp": timestamp,
            }
            print(f"Appending to topic '{topic}'...")
            result = self.proxy.addEntry(note)
            print(f"Appended to topic '{topic}'.")
        return

if __name__ == "__main__":
    client = Client()
    i = '-1'
    while (i != '0'):
        print("0) Exit")
        print("1) Add a new entry")
        print("2) Search for a topic")
        i = input("Choice: ")
        match i:
            case '1':
                client.newEntry()
            case '2':
                client.searchTopic()
            case '0':
                break
            case _:
                print("Invalid input, try again")