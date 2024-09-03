export class GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		this.packet = packet;
	}

	get toString() {
		let ret = "";
		for (let i = 0; i < this.packet.byteLength && i < 32; i++) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}

		if(this.packet.byteLength > 32) {
			ret += `(+${this.packet.byteLength-32} bytes)`;
		}

		return ret.trimEnd();

		
	}

	get getProperties(): Array<any> {
		return [
			"Unparsed Data",
			`Data: ${this.toString}`
		];
	}
}
