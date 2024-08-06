import { GenericPacket } from "./genericPacket";
import { IPPacket } from "./ipPacket";

export class ICMPPacket extends GenericPacket {
	packet: DataView;
    innerPacket: IPPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		this.innerPacket = new IPPacket(
					new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8),
				);
	}

	get type() {
		return this.packet.getUint8(0);
	}

    get code() {
		return this.packet.getUint8(1);
	}

    get checksum() {
		return this.packet.getUint16(2);
	}	

	get toString() {
		return `ICMP ${this.type}, ${this.code}, ${this.checksum}, ${this.innerPacket.toString}`;
	}
}
