import { Address6 } from "ip-address";
import { GenericPacket } from "./genericPacket";
import { ICMPPacket } from "./icmpPacket";
import { TCPPacket } from "./tcpPacket";
import { UDPPacket } from "./udpPacket";

export class IPv6Packet extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		switch (this.nextHeader) {
			case 0x01:
				this.innerPacket = new ICMPPacket(
					new DataView(packet.buffer, packet.byteOffset + 40, this.payloadLength),
				);
				break;
			case 0x06:
				this.innerPacket = new TCPPacket(
					new DataView(packet.buffer, packet.byteOffset + 40, this.payloadLength),
				);
				break;
			case 0x11:
				this.innerPacket = new UDPPacket(
					new DataView(packet.buffer, packet.byteOffset + 40, this.payloadLength),
				);
				break;
			default:
				this.innerPacket = new GenericPacket(
					new DataView(packet.buffer, packet.byteOffset + 40, this.payloadLength),
				);
		}
	
	}

	get version() {
		return this.packet.getUint8(0) >> 4;
	}

	get payloadLength() {
		return this.packet.getUint16(4);
	}

	get nextHeader() {
		return this.packet.getUint8(6);
	}

	

	

	get srcAddress() {
		const a = this.packet.buffer.slice(this.packet.byteOffset+64, this.packet.byteOffset+64+128/8);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
	}

	get destAddress() {
		const a = this.packet.buffer.slice(this.packet.byteOffset+64+128/8, this.packet.byteOffset+64+128/8 + 128/8);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
	}

	

	get toString() {
		return `IPv${this.version}, ${this.srcAddress.correctForm()} > ${this.destAddress.correctForm()}, (0x${this.nextHeader.toString(16)}), ${this.innerPacket.toString} `;
	}

	
}


