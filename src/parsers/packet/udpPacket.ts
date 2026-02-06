import * as vscode from 'vscode';
import { Node } from "../../packetdetailstree";
import { GenericPacket } from "./genericPacket";
import { FileContext } from "../file/FileContext";
import { DNSPacket } from "./dnsPacket";
import { DHCPPacket } from "./dhcpPacket";
import { vxlanPacket } from "./vxlanPacket";
import { QUICPacket} from "./quicPacket";
import { genevePacket } from "./genevePacket";

export class UDPPacket extends GenericPacket {
	public static readonly Name = "UDP";

	private static readonly _SrcPortOffset = 0;
	private static readonly _DstPortOffset = 2;
	private static readonly _LengthOffset = 4;
	private static readonly _ChecksumOffset = 6;

	private static readonly _SrcPortLength = 2;
	private static readonly _DstPortLength = 2;
	private static readonly _LengthLength = 2;
	private static readonly _ChecksumLength = 2;
	private static readonly _PacketLength = 8;

	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView, fc:FileContext) {
		super(packet, fc);
		this.registerProtocol(UDPPacket.Name, fc);
		
		this.packet = packet;
		const dv = new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8);
		fc.headers.push(this);

		if(this.destPort === 53 || this.srcPort === 53 || this.destPort === 5353 || this.srcPort === 5353) {
			this.innerPacket = new DNSPacket(dv, fc);
			return;
		}

		if(this.destPort === 67 || this.srcPort === 67 || this.destPort === 68 || this.srcPort === 68) {
			this.innerPacket = new DHCPPacket(dv, fc);
			return;
		}

		if(this.destPort === 443 || this.srcPort === 443) {
			this.innerPacket = QUICPacket.CreateQUICPacket(dv, fc);
			return;
		}

		if(this.destPort === 4789) {
			this.innerPacket = new vxlanPacket(dv, fc);
			return;
		}

		if(this.destPort === 6081) {
			this.innerPacket = new genevePacket(dv, fc);
			return;
		}

		this.innerPacket = new GenericPacket(dv, fc);
	}

	get srcPort() {
		return this.packet.getUint16(UDPPacket._SrcPortOffset);
	}

    get destPort() {
		return this.packet.getUint16(UDPPacket._DstPortOffset);
	}

    get length() {
		return this.packet.getUint16(UDPPacket._LengthOffset);
	}

    get checksum() {
        return this.packet.getUint16(UDPPacket._ChecksumOffset);
    }

	get toString() {
		return `UDP ${this.srcPort} > ${this.destPort}, ${this.innerPacket.toString}`;
	}
	
	get getProperties(): Node[] {
		const byteOffset = this.packet.byteOffset;
		const defaultState = vscode.TreeItemCollapsibleState.None;

		const elements: Node[] = [];
		let e = new Node("User Datagram Protocol", ``, vscode.TreeItemCollapsibleState.Collapsed, byteOffset, UDPPacket._PacketLength);
		e.children.push(new Node("Source Port", `${this.srcPort}`, defaultState, byteOffset + UDPPacket._SrcPortOffset, UDPPacket._SrcPortLength));
		e.children.push(new Node("Destination Port", `${this.destPort}`, defaultState, byteOffset + UDPPacket._DstPortOffset, UDPPacket._DstPortLength));
		e.children.push(new Node("Length", `${this.length}`, defaultState, byteOffset + UDPPacket._LengthOffset, UDPPacket._LengthLength));
		e.children.push(new Node("Checksum", `0x${this.checksum.toString(16)}`, defaultState, byteOffset + UDPPacket._ChecksumOffset, UDPPacket._ChecksumLength));
		elements.push(e);
		return elements.concat(this.innerPacket.getProperties);
	}
}
