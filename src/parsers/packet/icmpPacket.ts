import { GenericPacket } from "./genericPacket";
import { IPv4Packet } from "./ipv4Packet";

export class ICMPPacket extends GenericPacket {
	packet: DataView;
    innerPacket: IPv4Packet;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		this.innerPacket = new IPv4Packet(
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
