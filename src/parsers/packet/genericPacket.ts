export class GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		this.packet = packet;
	}

	get toString() {
		if(this.packet.byteLength === 0) {
			return "";
		}

		return `+${this.packet.byteLength} bytes unparsed data`;		
	}

	get getProperties(): Array<any> {
		if(this.packet.byteLength === 0) {
			return [];
		} else {
			return [
				"Unparsed Data",
				`Data: ${this.toString}`
			];
		}
	}
}
