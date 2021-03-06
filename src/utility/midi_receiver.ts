/*!
 * Licensed under the MIT License.
 */

import * as MRE from '../../../mixed-reality-extension-sdk/packages/sdk/';
//import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk/';

import WebSocket from 'ws';
import MusicModule from '../music_module';
import App from '../app';

export default class MidiReceiver extends MusicModule {
	private wss: WebSocket.Server = null;

	private lastNote=0;
	private lastVel=0;
	private lastChannel=0;
	private lastTime=0;

	public createServer(){
		if(this.wss){
			this.wss.close();
		}
		
		this.wss = new WebSocket.Server({ port: this.port });

		this.wss.on('connection', (ws: WebSocket) => {
			//is ws.url the correct way to get this?
			MRE.log.info("app", 'remote midi keyboard has connected from: ' + ws.url); 

			ws.on('message', (message: string) => {
				//MRE.log.info("app", 'received from client: %s', message);
				const messageArray: number[] = JSON.parse(message);

				const note = messageArray[0];
				const vel = messageArray[1];
				let channel = 0;

				if (messageArray.length > 2) {
					channel = messageArray[2];
				}			

				//const currentTime = Date.now();
				//const timeDiff = currentTime - this.lastTime;

				//if (note === this.lastNote && channel === this.lastChannel && timeDiff < 150 && vel >0) {
				//	MRE.log.info("app", "rejected! too close: " + timeDiff);
				//}else{				
				//}

				const sendMessage = [note, vel, channel];
				this.sendData(sendMessage, "midi")

				if (vel > 0) {
					this.lastNote = note;
					this.lastVel = vel;
					this.lastChannel = channel;
					//this.lastTime = currentTime;
				}
			});
		});
	}

	constructor(protected ourApp: App, public port: number) {
		super(ourApp);
		
		this.createServer();
	}
}
