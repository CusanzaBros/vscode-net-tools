import * as vscode from 'vscode';
import { Node } from "../../packetdetailstree";
import { GenericPacket } from "./genericPacket";
import { FileContext } from "../file/FileContext";
import { EthernetPacket } from "./ether";

export class genevePacket extends GenericPacket {
    public static readonly Name = "Geneve";

    private static readonly _VersionOffset = 0;
    private static readonly _OptLenOffset = 0;
    private static readonly _ControlPacketOffset = 1;
    private static readonly _CriticalOptionsOffset = 1;
    private static readonly _ProtocolTypeOffset = 2;
    private static readonly _VNIOffset = 4;

    private static readonly _VersionLength = 1;
    private static readonly _OptLenLength = 1;
    private static readonly _ControlPacketLength = 1;
    private static readonly _CriticalOptionsLength = 1;
    private static readonly _ProtocolTypeLength = 2;
    private static readonly _VNILength = 3;
    private static readonly _PacketLength = 8;

    innerPacket: GenericPacket;

    constructor(packet: DataView, fc:FileContext) {
        super(packet, fc);
        this.registerProtocol(genevePacket.Name, fc);

        this.innerPacket = EthernetPacket.processPayload(this.ProtocolType, new DataView(packet.buffer, packet.byteOffset + genevePacket._PacketLength + this.OptLen * 4, packet.byteLength - genevePacket._PacketLength - this.OptLen * 4), fc);

    }

    get Version():number {
        return (this.packet.getUint8(genevePacket._VersionOffset) & 0x3) >> 6;
    }
    get OptLen():number {
        return (this.packet.getUint8(genevePacket._OptLenOffset) & 0x3F);
    }
    get ControlPacket():boolean {
        return (this.packet.getUint8(genevePacket._ControlPacketOffset) & 0x40) > 0;
    }
    get CriticalOptions():boolean {
        return (this.packet.getUint8(genevePacket._CriticalOptionsOffset) & 0x8) > 0;
    }
    get ProtocolType():number {
        return this.packet.getUint16(genevePacket._ProtocolTypeOffset);
    }
    get VNI():number {
        return this.packet.getUint32(genevePacket._VNIOffset) >> 8;
    }

    
	get options(): GeneveOption[] {
		if(this.packet.byteLength <= genevePacket._PacketLength + this.OptLen * 4) {
			return [];
		}
		let i = this.packet.byteOffset + genevePacket._PacketLength;
		const options: GeneveOption[] = [];

		while (i + 4 < this.packet.byteOffset + genevePacket._PacketLength + this.OptLen * 4) {
			const option = GeneveOption.create(new DataView(this.packet.buffer, i, this.packet.buffer.byteLength - i));
            i += option.length + 4;
            options.push(option);
		}
		return options;
	}

    get toString() {
        return `Geneve ${this.VNI}: ${this.innerPacket.toString}`;
    }

    get getProperties(): Node[] {
        const byteOffset = this.packet.byteOffset;
        const defaultState = vscode.TreeItemCollapsibleState.None;

        const elements: Node[] = [];
        let e = new Node("Generic Network Virtualization Encapsulation", `VNI: ${this.VNI}`, vscode.TreeItemCollapsibleState.Collapsed, byteOffset, genevePacket._PacketLength + this.OptLen * 4);
        e.children.push(new Node("Version", `${this.Version}`, defaultState, byteOffset + genevePacket._VersionOffset, genevePacket._VersionLength));
        e.children.push(new Node("Options Length", `${this.OptLen * 4} bytes`, defaultState, byteOffset + genevePacket._OptLenOffset, genevePacket._OptLenLength));
        e.children.push(new Node("Control Packet", `${this.ControlPacket}`, defaultState, byteOffset + genevePacket._ControlPacketOffset, genevePacket._ControlPacketLength));
        e.children.push(new Node("Critical Options", `${this.CriticalOptions}`, defaultState, byteOffset + genevePacket._CriticalOptionsOffset, genevePacket._CriticalOptionsLength));
        e.children.push(new Node("Protocol Type", `0x${this.ProtocolType.toString(16).padStart(4, "0")}`, defaultState, byteOffset + genevePacket._ProtocolTypeOffset, genevePacket._ProtocolTypeLength));
        e.children.push(new Node("Virtual Network Identifier (VNI)", `${this.VNI}`, defaultState, byteOffset + genevePacket._VNIOffset, genevePacket._VNILength));
        if(this.options.length > 0) {
            let offset = byteOffset + genevePacket._PacketLength; 
            let e2 = new Node("Options", ``, vscode.TreeItemCollapsibleState.Collapsed, offset, this.OptLen * 4);
            this.options.forEach(item => {
                e2.children.push(...item.getProperties);
                offset += item.length + 4;
            });
            e.children.push(e2);
        }

        elements.push(e);

        return elements.concat(this.innerPacket.getProperties);
    }
}

class GeneveOption {
    optionData: DataView;
    length: number;
    optionClass: number;
    type: number;

    constructor(dv: DataView, offset: number, length: number, optionClass: number, type: number) {
        this.optionData = new DataView(dv.buffer, offset, length*4);
        this.length = length;
        this.optionClass = optionClass;
        this.type = type;
    }

    static create(dv: DataView): GeneveOption {
		switch (dv.getUint16(0)) {
			default:
				return new GeneveOption(dv, dv.byteOffset + 4, dv.getUint8(3) & 0x1F, dv.getUint16(0), dv.getUint8(2));
		}
	}
	
    get optionClassName(): string {
        let optionName = "";


        switch (this.optionClass) {
            case 0x0100: optionName = "Linux"; break;
            case 0x0101: optionName = "Open vSwitch (OVS)"; break;
            case 0x0102: optionName = "Open Virtual Networking (OVN)"; break;
            case 0x0103: optionName = "In-band Network Telemetry (INT)"; break;
            case 0x0104: optionName = "VMware, Inc."; break;
            case 0x0105: optionName = "Amazon.com, Inc."; break;
            case 0x0106: optionName = "Cisco Systems, Inc."; break;
            case 0x0107: optionName = "Oracle Corporation"; break;
            case 0x0129: optionName = "Oxide Computer Company"; break;
            case 0x0136: optionName = "InfoQuick Global Connection Tech Ltd."; break;
            case 0x014A: optionName = "EMnify GmbH"; break;
            case 0x014B: optionName = "Cilium"; break;
            case 0x014C: optionName = "Corelight, Inc."; break;
            case 0x014D: optionName = "1NCE GmbH"; break;
            case 0x0162: optionName = "nat64.net"; break;
            case 0x0163: optionName = "Multi Segment SD-WAN"; break;
            case 0x0164: optionName = "cPacket Networks"; break;
            case 0x0168: optionName = "ExtraHop Networks, Inc."; break;
            case 0x0169: optionName = "Soosan INT Co., Ltd."; break;
            case 0x016D: optionName = "617A Corporation"; break;
            default:
                if (this.optionClass >= 0x0108 && this.optionClass <= 0x0110) {
                    optionName = "Amazon.com, Inc.";
                } else if (this.optionClass >= 0x0111 && this.optionClass <= 0x0118) {
                    optionName = "IBM";
                } else if (this.optionClass >= 0x0119 && this.optionClass <= 0x0128) {
                    optionName = "Ericsson";
                } else if (this.optionClass >= 0x0130 && this.optionClass <= 0x0131) {
                    optionName = "Cisco Systems, Inc.";
                } else if (this.optionClass >= 0x0132 && this.optionClass <= 0x0135) {
                    optionName = "Google LLC";
                } else if (this.optionClass >= 0x0137 && this.optionClass <= 0x0140) {
                    optionName = "Alibaba, inc.";
                } else if (this.optionClass >= 0x0141 && this.optionClass <= 0x0144) {
                    optionName = "Palo Alto Networks";
                } else if (this.optionClass >= 0x0145 && this.optionClass <= 0x0149) {
                    optionName = "Huawei Technologies Co., Ltd.";
                } else if (this.optionClass >= 0x014E && this.optionClass <= 0x0157) {
                    optionName = "Cloud of China Telecom (CTYUN)";
                } else if (this.optionClass >= 0x0158 && this.optionClass <= 0x0161) {
                    optionName = "Volcengine, Inc.";
                } else if (this.optionClass >= 0x0165 && this.optionClass <= 0x0167) {
                    optionName = "Tencent";
                } else if (this.optionClass >= 0x016A && this.optionClass <= 0x016C) {
                    optionName = "Spacelink, Inc";
                } else if (this.optionClass <= 0xFF || (this.optionClass >= 0x016E && this.optionClass <= 0xFEFF)) {
                    optionName = `Unassigned`;
                } else if (this.optionClass >= 0xFF00 && this.optionClass <= 0xFFFF) {
                        optionName = `Experimental`;
                } else {
                    optionName = `Unknown`;
                }
        }
        return `${optionName} (0x${this.optionClass.toString(16)})`;
    }

    get OptionDataHex(): string {
        let ret = "";
        for (let i = 0; i < this.length * 4; i++) {
            ret += this.optionData.getUint8(i).toString(16).padStart(2, "0");
        }
        return ret;
    }

    get typeOption(): string {
        if (this.type & 0x80) {
            return "Critical";
        } else {
            return "Non-critical";
        }
    }

    get toString(): string {
        return `Unknown, Class: ${this.optionClassName} Type: 0x${this.type.toString(16)} (${this.typeOption}) Length: ${this.length*4} bytes`;
    }

    get getProperties(): Node[] {
        const e = new Node("Unknown", `Class: ${this.optionClassName} Type: 0x${this.type.toString(16)} (${this.typeOption})`, vscode.TreeItemCollapsibleState.Collapsed, this.optionData.byteOffset-4, 4 + this.length*4);
        e.children.push(new Node("Class", `${this.optionClassName}`, vscode.TreeItemCollapsibleState.None, this.optionData.byteOffset-4, 2));
        e.children.push(new Node("Type", `0x${this.type.toString(16)} (${this.typeOption})`, vscode.TreeItemCollapsibleState.None, this.optionData.byteOffset-2, 1));
        e.children.push(new Node("Length", `${this.length*4} bytes`, vscode.TreeItemCollapsibleState.None, this.optionData.byteOffset-1, 1));
        e.children.push(new Node("Data", `${this.OptionDataHex}`, vscode.TreeItemCollapsibleState.None, this.optionData.byteOffset, this.length*4));
        return [e];
    }
}
