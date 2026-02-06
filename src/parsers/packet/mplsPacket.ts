import * as vscode from 'vscode';
import { Node } from "../../packetdetailstree";
import { GenericPacket } from "./genericPacket";
import { FileContext } from "../file/FileContext";
import { EthernetPacket } from "./ether";

export class mplsPacket extends GenericPacket {
    public static readonly Name = "MPLS";

    innerPacket: GenericPacket;
    private _lines:string[] = [];

    private static readonly _labelOffset = 0;
    private static readonly _expOffset = 0;
    private static readonly _bosOffset = 0;
    private static readonly _ttlOffset = 3;
	private static readonly _PayloadOffset = 4;

    private static readonly _labelLength = 4;
    private static readonly _expLength = 4;
    private static readonly _bosLength = 4;
    private static readonly _ttlLength = 1;
	private static readonly _PayloadLength = 2;

    constructor(packet: DataView, fc:FileContext) {
        super(packet, fc);
        this.registerProtocol(mplsPacket.Name, fc);
        fc.headers.push(this);
        this.innerPacket = EthernetPacket.processPayload(this.protocolType, new DataView(packet.buffer, packet.byteOffset + mplsPacket._PayloadOffset, packet.byteLength - mplsPacket._PayloadOffset), fc);
    }

    get protocolType():number {
        if (this.bos) {
            return 0x0800;
        } else {
            return 0x8847;
        }
    }
    get label():number {
        return (this.packet.getUint32(mplsPacket._labelOffset) >> 12);
    }
    get exp():number {
        return (this.packet.getUint32(mplsPacket._expOffset) >> 9 & 0x7);
    }
    get bos():boolean {
        return (this.packet.getUint32(mplsPacket._bosOffset) >> 8 & 0x1) !== 0;
    }
    get ttl():number {
        return (this.packet.getUint8(mplsPacket._ttlOffset));
    }

    get toString() {
        if (this.bos) {
            return `MPLS ${this.innerPacket.toString}`;
        } else {
            return `${this.innerPacket.toString}`;
        }
    }

    get getProperties(): Node[] {
        const byteOffset = this.packet.byteOffset;
        const defaultState = vscode.TreeItemCollapsibleState.None;
        const protocolName = this.protocolType ? EthernetPacket.namePayload(this.protocolType) : 'Possible MPLS Keepalive Packet';

        const elements: Node[] = [];
        let mplsLength = 4;
        let e = new Node("Multi-Protocol Label Switching (MPLS)", `Label: ${this.label}, EXP: ${this.exp}, S: ${this.bos}, TTL: ${this.ttl}`, vscode.TreeItemCollapsibleState.Collapsed, byteOffset, mplsLength);
        e.children.push(new Node("Label", `${this.label}`, defaultState, byteOffset + mplsPacket._labelOffset, mplsPacket._labelLength));
        e.children.push(new Node("Experimental Bits", `${this.exp}`, defaultState, byteOffset + mplsPacket._expOffset, mplsPacket._expLength));
        e.children.push(new Node("Bottom of Label Stack", `${this.bos}`, defaultState, byteOffset + mplsPacket._bosOffset, mplsPacket._bosLength));
        e.children.push(new Node("TTL", `${this.ttl}`, defaultState, byteOffset + mplsPacket._ttlOffset, mplsPacket._ttlLength));
        elements.push(e);
        return elements.concat(this.innerPacket.getProperties);
    }
}