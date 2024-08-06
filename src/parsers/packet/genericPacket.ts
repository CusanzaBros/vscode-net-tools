export class GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		this.packet = packet;
	}

	get toString() {
		let ret = "";
		for (let i = 0; i < this.packet.byteLength && i < 16; i++) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}
}
