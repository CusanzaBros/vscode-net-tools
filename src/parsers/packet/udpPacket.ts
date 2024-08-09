import { GenericPacket } from "./genericPacket";
import { DNSPacket } from "./dnsPacket";
import { DHCPPacket } from "./dhcpPacket";

export class UDPPacket extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		if(this.destPort == 53 || this.srcPort == 53 || this.destPort == 5353 || this.srcPort == 5353) {
			this.innerPacket = new DNSPacket(
				new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8),
			);
			return;
		}

		if(this.destPort == 67 || this.srcPort == 67 || this.destPort == 68 || this.srcPort == 68) {
			this.innerPacket = new DHCPPacket(
				new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8),
			);
			return;
		}

		this.innerPacket = new GenericPacket(
			new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8),
		);
	}

	get srcPort() {
		return this.packet.getUint16(0);
	}

    get destPort() {
		return this.packet.getUint16(2);
	}

    get length() {
		return this.packet.getUint16(4);
	}

    get checksum() {
        return this.packet.getUint16(6);
    }

	

	get toString() {
		return `UDP ${this.srcPort} > ${this.destPort}, ${this.length}, ${this.checksum} ${this.innerPacket.toString}`;
	}
}
