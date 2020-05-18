import time
import sqlite3
import json
import logging
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient


# Custom MQTT message callback
def process_data(client, userdata, message):

    msg = message.payload.decode('utf8') #.replace("'", '"')
    data = json.loads( msg )
    
    # Get the id of the UAR app
    mobile_id = str(message.topic).split("/")[1]
    classification_topic = 'sensor/'+mobile_id+'/activity'

    print("Received message from: %s\nSending response to: %s"%(str(message.topic),classification_topic ))

    response = {}
    if(float(data['acc_mod'])>=0.6):
       response['activity'] = "moving"
    else:
        response['activity'] = "laying"

    send_data(response , classification_topic)



def init_mqtt_connection(useWebsocket = False,
    clientId = 'basicPubSub',
    host = 'a1czszdg9cjrm-ats.iot.us-east-1.amazonaws.com',
    rootCAPath = 'root-CA.crt',
    privateKeyPath = 'station.private.key',
    certificatePath = 'station.cert.pem'):

    port = 8883 if not useWebsocket else 443
    useWebsocket = useWebsocket
    clientId = clientId
    host = host
    port = port
    rootCAPath = rootCAPath
    privateKeyPath = privateKeyPath
    certificatePath = certificatePath

    logger = logging.getLogger("AWSIoTPythonSDK.core")
    logger.setLevel(logging.NOTSET)
    streamHandler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    streamHandler.setFormatter(formatter)
    logger.addHandler(streamHandler)

    # Init AWSIoTMQTTClient
    myAWSIoTMQTTClient = None
    if useWebsocket:
        myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId, useWebsocket=True)
        myAWSIoTMQTTClient.configureEndpoint(host, port)
        myAWSIoTMQTTClient.configureCredentials(rootCAPath)
    else:
        myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
        myAWSIoTMQTTClient.configureEndpoint(host, port)
        myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

    # AWSIoTMQTTClient connection configuration
    myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
    myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # param: queue_size,if set to 0, the queue is disabled. If set to -1, the queue size is set to be infinite.
    myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
    myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
    myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  # 5 sec

    return myAWSIoTMQTTClient


def send_data( data, topic):
    """"
    data: dict to be transformed into json
    """
    sendClient = init_mqtt_connection(clientId="cons2")
    sendClient.connect()
    messageJson = json.dumps(data)
    sendClient.publish(topic, messageJson, 1)
    print('Published topic %s: %s\n' % (topic, messageJson))
    sendClient.disconnect()



if __name__ == "__main__":

    clientId = 'cons1'
    topic = 'sensor/+/accelerometer'

    # Connect and subscribe to AWS IoT
    myAWSIoTMQTTClient = init_mqtt_connection(clientId=clientId)
    myAWSIoTMQTTClient.connect()
    myAWSIoTMQTTClient.subscribe(topic, 1, process_data)

    while True:
        print("Listening...")
        time.sleep(60)


    myAWSIoTMQTTClient.disconnect()


