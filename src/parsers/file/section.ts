import { EthernetPacket } from "../packet/ether";
import { GenericPacket } from "../packet/genericPacket";
import { SLL2Packet } from "../packet/sll2";

function getLinkName(id:number):string {
	switch (id) {
		case 0: return "NULL";
		case 1: return "Ethernet";
		case 2: return "Experimental Ethernet";
		case 3: return "AX.25";
		case 4: return "Proteon ProNET Token Ring";
		case 5: return "Chaos";
		case 6: return "IEEE 802.5 Token Ring";
		case 7: return "ARCNET";
		case 8: return "SLIP";
		case 9: return "PPP";
		case 10: return "FDDI";
		case 32: return "Redback SmartEdge 400/800";
		case 50: return "PPP_SERIAL";
		case 51: return "PPPoE";
		case 99: return "SYMANTEC_FIREWALL";
		case 100: return "ATM_RFC1483";
		case 101: return "RAW";
		case 104: return "C_HDLC";
		case 105: return "IEEE802_11";
		case 106: return "ATM_CLIP";
		case 107: return "FRELAY";
		case 108: return "LOOP";
		case 109: return "ENC";
		case 112: return "HDLC";
		case 113: return "LINUX_SLL";
		case 114: return "LTALK";
		case 115: return "ECONET";
		case 116: return "IPFILTER";
		case 117: return "PFLOG";
		case 118: return "CISCO_IOS";
		case 119: return "PRISM_HEADER";
		case 120: return "AIRONET_HEADER";
		case 122: return "IP_OVER_FC";
		case 123: return "SUNATM";
		case 124: return "RIO";
		case 125: return "PCI_EXP";
		case 126: return "AURORA";
		case 127: return "IEEE802_11_RADIO";
		case 128: return "TZSP";
		case 129: return "ARCNET_LINUX";
		case 130: return "JUNIPER_MLPPP";
		case 131: return "JUNIPER_MLFR";
		case 132: return "JUNIPER_ES";
		case 133: return "JUNIPER_GGSN";
		case 134: return "JUNIPER_MFR";
		case 135: return "JUNIPER_ATM2";
		case 136: return "JUNIPER_SERVICES";
		case 137: return "JUNIPER_ATM1";
		case 138: return "APPLE_IP_OVER_IEEE1394";
		case 139: return "MTP2_WITH_PHDR";
		case 140: return "MTP2";
		case 141: return "MTP3";
		case 142: return "SCCP";
		case 143: return "DOCSIS";
		case 144: return "LINUX_IRDA";
		case 145: return "IBM_SP";
		case 146: return "IBM_SN";
		case 147:
		case 148:
		case 149:
		case 150:
		case 151:
		case 152:
		case 153:
		case 154:
		case 155:
		case 156:
		case 157:
		case 158:
		case 159:
		case 160:
		case 161:
		case 162: return "USER0–DLT_USER15";
		case 163: return "IEEE802_11_RADIO_AVS";
		case 164: return "JUNIPER_MONITOR";
		case 165: return "BACNET_MS_TP";
		case 166: return "PPP_PPPD";
		case 167: return "JUNIPER_PPPOE";
		case 168: return "JUNIPER_PPPOE_ATM";
		case 169: return "GPRS_LLC";
		case 170: return "GPF_T";
		case 171: return "GPF_F";
		case 172: return "GCOM_T1E1";
		case 173: return "GCOM_SERIAL";
		case 174: return "JUNIPER_PIC_PEER";
		case 175: return "ERF_ETH";
		case 176: return "ERF_POS";
		case 177: return "LINUX_LAPD";
		case 178: return "JUNIPER_ETHER";
		case 179: return "JUNIPER_PPP";
		case 180: return "JUNIPER_FRELAY";
		case 181: return "JUNIPER_CHDLC";
		case 182: return "MFR";
		case 183: return "JUNIPER_VP";
		case 184: return "A429";
		case 185: return "A653_ICM";
		case 186: return "USB_FREEBSD";
		case 187: return "BLUETOOTH_HCI_H4";
		case 188: return "IEEE802_16_MAC_CPS";
		case 189: return "USB_LINUX";
		case 190: return "CAN20B";
		case 191: return "IEEE802_15_4_LINUX";
		case 192: return "PPI";
		case 193: return "IEEE802_16_MAC_CPS_RADIO";
		case 194: return "JUNIPER_ISM";
		case 195: return "IEEE802_15_4_WITHFCS";
		case 196: return "SITA";
		case 197: return "ERF";
		case 198: return "RAIF1";
		case 199: return "IPMB_KONTRON";
		case 200: return "JUNIPER_ST";
		case 201: return "BLUETOOTH_HCI_H4_WITH_PHDR";
		case 202: return "AX25_KISS";
		case 203: return "LAPD";
		case 204: return "PPP_WITH_DIR";
		case 205: return "C_HDLC_WITH_DIR";
		case 206: return "FRELAY_WITH_DIR";
		case 207: return "LAPB_WITH_DIR";
		case 209: return "IPMB_LINUX";
		case 209: return "I2C_LINUX";
		case 210: return "FLEXRAY";
		case 211: return "MOST";
		case 212: return "LIN";
		case 213: return "X2E_SERIAL";
		case 214: return "X2E_XORAYA";
		case 215: return "IEEE802_15_4_NONASK_PHY";
		case 216: return "LINUX_EVDEV";
		case 217: return "GSMTAP_UM";
		case 218: return "GSMTAP_ABIS";
		case 219: return "MPLS";
		case 220: return "USB_LINUX_MMAPPED";
		case 221: return "DECT";
		case 222: return "AOS";
		case 223: return "WIHART";
		case 224: return "FC_2";
		case 225: return "FC_2_WITH_FRAME_DELIMS";
		case 226: return "IPNET";
		case 227: return "CAN_SOCKETCAN";
		case 228: return "IPV4";
		case 229: return "IPV6";
		case 230: return "IEEE802_15_4_NOFCS";
		case 231: return "DBUS";
		case 232: return "JUNIPER_VS";
		case 233: return "JUNIPER_SRX_E2E";
		case 234: return "JUNIPER_FIBRECHANNEL";
		case 235: return "DVB_CI";
		case 236: return "MUX27010";
		case 237: return "STANAG_5066_D_PDU";
		case 238: return "JUNIPER_ATM_CEMIC";
		case 239: return "NFLOG";
		case 240: return "NETANALYZER";
		case 241: return "NETANALYZER_TRANSPARENT";
		case 242: return "IPOIB";
		case 243: return "MPEG_2_TS";
		case 244: return "NG40";
		case 245: return "NFC_LLCP";
		case 246: return "PFSYNC";
		case 247: return "INFINIBAND";
		case 248: return "SCTP";
		case 249: return "USBPCAP";
		case 250: return "RTAC_SERIAL";
		case 251: return "BLUETOOTH_LE_LL";
		case 252: return "WIRESHARK_UPPER_PDU";
		case 253: return "NETLINK";
		case 254: return "BLUETOOTH_LINUX_MONITOR";
		case 255: return "BLUETOOTH_BREDR_BB";
		case 256: return "BLUETOOTH_LE_LL_WITH_PHDR";
		case 257: return "PROFIBUS_DL";
		case 258: return "PKTAP";
		case 259: return "EPON";
		case 260: return "IPMI_HPM_2";
		case 261: return "ZWAVE_R1_R2";
		case 262: return "ZWAVE_R3";
		case 263: return "WATTSTOPPER_DLM";
		case 264: return "ISO_14443";
		case 265: return "RDS";
		case 266: return "USB_DARWIN";
		case 267: return "OPENFLOW";
		case 268: return "SDLC";
		case 269: return "TI_LLN_SNIFFER";
		case 270: return "LORATAP";
		case 271: return "VSOCK";
		case 272: return "NORDIC_BLE";
		case 273: return "DOCSIS31_XRA31";
		case 274: return "ETHERNET_MPACKET";
		case 275: return "DISPLAYPORT_AUX";
		case 276: return "LINUX_SLL2";
		case 277: return "SERCOS_MONITOR";
		case 278: return "OPENVIZSLA";
		case 279: return "EBHSCR";
		case 280: return "VPP_DISPATCH";
		case 281: return "DSA_TAG_BRCM";
		case 282: return "DSA_TAG_BRCM_PREPEND";
		case 283: return "IEEE802_15_4_TAP";
		case 284: return "DSA_TAG_DSA";
		case 285: return "DSA_TAG_EDSA";
		case 286: return "ELEE";
		case 287: return "Z_WAVE_SERIAL";
		case 288: return "USB_2_0";
		case 289: return "ATSC_ALP";
		case 290: return "ETW";
		case 291: return "NETANALYZER_NG";
		case 292: return "ZBOSS_NCP";
		case 293: return "USB_2_0_LOW_SPEED";
		case 294: return "USB_2_0_FULL_SPEED";
		case 295: return "USB_2_0_HIGH_SPEED";
		case 296: return "AUERSWALD_LOG";
		case 297: return "ZWAVE_TAP";
		case 298: return "SILABS_DEBUG_CHANNEL";
		case 299: return "FIRA_UCI";
		case 300: return "MDB";
		case 301: return "DECT_NR";
		default:
			return "Unknown";
	}
}


export class Section {
	startoffset: number = 0;
	endoffset: number = 0;

	static processPayload(linktype: number, payload: DataView): GenericPacket {
			try {
				if (linktype === 1) {  //Ethernet II
					return new EthernetPacket(payload);
				} else if (linktype === 276) { // Linux SLL2
					return new SLL2Packet(payload);
				} 
			} catch (e) {
				if (e instanceof Error) {
					console.log(`Exception parsing payload, call stack: ${e.stack}`);
				} else {
					console.log(`Exception parsing payload.`);
				}			
			}  // In case of exception in parsing, treat as a generic packet.

			return new GenericPacket(payload);
	}

	constructor(
		protected readonly _packet: DataView
	) { 
		this.startoffset = this._packet.byteOffset;
		this.endoffset = this.startoffset + this._packet.byteLength;
	}

	static create(bytes: Uint8Array): Section {
		
		const dv = new DataView(bytes.buffer, 0, bytes.byteLength);
		const magic = dv.getUint32(0, true);
		if (
			magic === 0xa1b2c3d4 ||
			magic === 0xa1b23c4d ||
			magic === 0xd4c3b2a1 ||
			magic === 0x4d3cb2a1
		) {
			return new PCAPHeaderRecord(bytes);
		}
		if(magic === 0x0A0D0D0A) {
			return PCAPNGSection.createPCAPNG(bytes, 0);
		}
		throw new Error("Not a pcap/pcapng");
	}

	static createNext(bytes: Uint8Array, prevRecord: Section, headerRecord: Section): Section {
		if(headerRecord.fileType === 1) {
			return new PCAPPacketRecord(bytes, prevRecord.endoffset, headerRecord as PCAPHeaderRecord);
		}
		if(headerRecord.fileType === 2) {
			return PCAPNGSection.createPCAPNG(bytes, prevRecord.endoffset, headerRecord as PCAPNGSectionHeaderBlock);
		}

		throw new Error("invalid");
	}

	get getProperties(): Array<any> {
		return [];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this._packet.byteLength; i++) {
			ret += this._packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this._packet).replaceAll(/[\x00\W]/g, ".");
	}

	get toString() {
		return "Basic Section";
	}

	get comments():string[] {
		return [];
	}

	get fileType():number { return -1; };
}


//#region PCAP




export class PCAPPacketRecord extends Section {
	timestamp1: Date;
	timestamp2: number;
	capturedlength: number;
	originallength: number;
	packet: GenericPacket;

	constructor(bytes: Uint8Array, offset: number, header: PCAPHeaderRecord) {
		const dv = new DataView(bytes.buffer, offset, 16);
		super(new DataView(bytes.buffer, offset, dv.getUint32(8, header.le) + 16));
		this.startoffset = offset;
		header.isMS;
		this.timestamp1 = new Date(this._packet.getUint32(0, header.le)*1000);
		this.timestamp2 = this._packet.getUint32(4, header.le);
		this.capturedlength = this._packet.getUint32(8, header.le);
		this.originallength = this._packet.getUint32(12, header.le);
		this.endoffset = this.capturedlength + offset + 16;

		this.packet = Section.processPayload(header.linktype, new DataView(bytes.buffer, offset + 16, this.capturedlength));
		
		if(header.isMS) {
			this.timestamp2*=1000;
		}
	}
	
	get toString() {
		return `${this.timestamp1.getFullYear()}-${(this.timestamp1.getMonth()+1).toString().padStart(2, "0")}-${this.timestamp1.getDate().toString().padStart(2, "0")} ${this.timestamp1.getHours().toString().padStart(2, "0")}:${this.timestamp1.getMinutes().toString().padStart(2, "0")}:${this.timestamp1.getSeconds().toString().padStart(2, "0")}.${this.timestamp2.toString().padStart(9, "0")}: ${this.packet.toString}`;
	}

	get getProperties(): Array<any> {
		return [
			`Packet Block: ${this.originallength} bytes on wire, ${this.capturedlength} bytes captured`,
			this.packet.getProperties
		];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this.packet.packet.byteLength; i++) {
			ret += this.packet.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this.packet.packet).replaceAll(/[\x00\W]/g, ".");

	}
}

export class PCAPHeaderRecord extends Section {
	magic: number;
	major: number;
	minor: number;
	r1: number;
	r2: number;
	snaplen: number;
	linktype: number;
	le: boolean;
	isMS: boolean;
	isFCS: boolean;
	fcs: number;

	constructor(bytes: Uint8Array) {
		super(new DataView(bytes.buffer, 0, 24));
		this.startoffset = 0;
		this.magic = this._packet.getUint32(0, true);
		if (
			this.magic !== 0xa1b2c3d4 &&
			this.magic !== 0xa1b23c4d &&
			this.magic !== 0xd4c3b2a1 &&
			this.magic !== 0x4d3cb2a1
		) {
			throw new Error("not a pcap file");
		}
		this.le = this.magic === 0xa1b2c3d4 || this.magic === 0xa1b23c4d;
		this.isMS = this.magic === 0xa1b2c3d4 || this.magic === 0x4d3cb2a1;
		this.major = this._packet.getUint16(4, this.le);
		this.minor = this._packet.getUint16(6, this.le);
		this.r1 = this._packet.getUint32(8, true);
		this.r2 = this._packet.getUint32(12, true);
		this.snaplen = this._packet.getUint32(16, true);
		this.linktype = this._packet.getUint32(20, true);
		this.isFCS = ((this.linktype >> 28) & 0x1) === 0x1;
		this.fcs = this.linktype >> 29;
		this.linktype = this.linktype & 0x0fffffff;
		this.endoffset = 24;
	}

	get fileType() {
		return 1;
	}

	get toString() {
		return `magic number: ${this.magic.toString(16)}, version: ${this.major.toString()}.${this.minor.toString()}, snaplen: ${this.snaplen.toString()}, linktype: ${getLinkName(this.linktype)} (${this.linktype.toString()})`;
	}

}



//#region PCAPNG






export class PCAPNGSection extends Section {
	_le: boolean;
	
	static createPCAPNG(bytes: Uint8Array, offset: number, header?: PCAPNGSectionHeaderBlock): Section {
		
		if(bytes.byteLength <= offset) {
			console.log("byte length less than offset");
		}
		let dv = new DataView(bytes.buffer, offset, bytes.byteLength - offset);
		const le: boolean = header === undefined ? (dv.getUint32(8, true) === 0x1A2B3C4D): header.le;
		const blockType = dv.getUint32(0, le);
		const blockLength = Math.ceil(dv.getUint32(4, le) / 4) * 4;
		dv = new DataView(bytes.buffer, offset, blockLength);

		switch(blockType) {
			case 0x0A0D0D0A:
				return new PCAPNGSectionHeaderBlock(dv);
			case 0x00000001:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGInterfaceDescriptionBlock(dv, header);
			case 0x00000003:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGSimplePacketBlock(dv, header);				
			case 0x00000005:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGInterfaceStatisticsBlock(dv, header);
			case 0x00000006:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGEnhancedPacketBlock(dv, header);
			default:
				if(header === undefined) {
					throw new Error("header required");
				}
				return new PCAPNGGenericBlock(dv, header);
		}
	}

	constructor(dv: DataView, le: boolean) {
		super(dv);
		this._le = le;
	}

	get le():boolean { return this._le; };

	get optionStartOffset():number { return 20; };

	get blockType():number {
		return this._packet.getUint32(0, this.le);
	}

	get blockLength():number {
		return Math.ceil(this._packet.getUint32(4, this.le) / 4) * 4;
	}

	get comments():string[] {
		const ret:string[] = [];

		if(this.options !== undefined) {
			for (const opt of this.options) {
				if (opt.code === 1) {
					const decoder = new TextDecoder('utf-8');
					ret.push(decoder.decode(opt.value));
				}
			};
		}
		return ret;
	}

	get options() {
		const options: PCAPNGOption[] = [];

		if(this.optionStartOffset === -1 || this.optionStartOffset >= this.blockLength-4) {
			return options;
		}

		let i = this._packet.byteOffset + this.optionStartOffset;
		
		do {
			const option = new PCAPNGOption(this._packet.buffer, i, this.le);
			if(option.code !== 0) {
				options.push(option);
			} else {
				break;
			}
			i+= option.length+4;
			if(option.length % 4) {
				i += 4 - option.length % 4;
			}
		} while(i < this._packet.byteLength-4);
		
		return options;
	}
	
}


export class PCAPNGInterfaceDescriptionBlock extends PCAPNGSection {
	interfaceID: number;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv, header.le);
		header.interfaces.push(this);
		this.interfaceID = header.interfaceCount++;
	}
	
	get linkType() {
		return this._packet.getUint16(8, this.le);
	}

	get snapLen() {
		return this._packet.getUint32(12, this.le);
	}

	get optionStartOffset():number { return 16; };

	get toString() {
		return `Interface ${this.interfaceID}: ${this.Name}`;
	}

	get Name():string {
		if(this.options !== undefined) {
			for (const opt of this.options) {
				if (opt.code === 2) {
					const decoder = new TextDecoder('utf-8');
					return decoder.decode(opt.value);
				}
			};
		}
		return "Unnamed";
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			"*Interface Description Block"
		];
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						arr.push(`Comment: ${decoder.decode(this.options[i].value)}`);
						break;
					case 2:
						arr.push(`Name: ${decoder.decode(this.options[i].value)}`);
						break;
					default:
						arr.push(`Option ${this.options[i].code}: Unknown`);
				}
			}
		}
		return [arr];
	}
}

class PCAPNGOption {
	dv: DataView;
	le: boolean;

	constructor(bytes: ArrayBuffer, offset: number, le: boolean) {
		this.dv = new DataView(bytes, offset, bytes.byteLength - offset);
		this.le = le;
	}

	get code() {
		return this.dv.getUint16(0, this.le);
	}

	get length() {
		return this.dv.getUint16(2, this.le);
	}

	get value() {
		return new DataView(this.dv.buffer, this.dv.byteOffset + 4, this.length);
	}


}

export class PCAPNGGenericBlock extends PCAPNGSection {
	data: GenericPacket;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv, header.le);
		this.data = new GenericPacket(new DataView(dv.buffer, dv.byteOffset + 8, this.blockLength - 12));
		
	}

	get optionStartOffset():number { return -1; };

	get toString() {
		return `Block Type ${this.blockType} (${this.blockLength} bytes): ${this.data.toString}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			`Block Type ${this.blockType}`,
			`Block Length: ${this.blockLength}`
		];

		return [arr, this.data.getProperties];
	}
}

export class PCAPNGEnhancedPacketBlock extends PCAPNGSection {
	data: GenericPacket;
	private _header: PCAPNGSectionHeaderBlock;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv, header.le);
		this._header = header;

		this.data = Section.processPayload(header.interfaces[this.interfaceID].linkType, new DataView(dv.buffer, dv.byteOffset + 28, this.capturedLength));
	}

	get interfaceID() {
		return this._packet.getUint32(8, this.le);
	}

	get tsHigh() {
		return this._packet.getUint32(12, this.le);
	}

	get tsLow() {
		return this._packet.getUint32(16, this.le);
	}

	get capturedLength() {
		return this._packet.getUint32(20, this.le);
	}

	get originalLength() {
		return this._packet.getUint32(24, this.le);
	}

	get optionStartOffset():number {
		let optionstart = 28 + this.capturedLength;
		if(this.capturedLength % 4) {
			optionstart += 4 - this.capturedLength % 4;
		}
		return optionstart;
	}
	
	get timestamp(): string {
		const upper64 = BigInt(this.tsHigh) << 32n;
		const lower64 = BigInt(this.tsLow);
		
		let timeVal: number = Number(upper64 | lower64);
		let timeValSec: number = timeVal/1000;
		let ms = timeVal%1000000;
		let date = new Date(timeValSec);
		return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${(ms*1000).toString().padStart(9, "0")}`;
	}

	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}`;
						break;
					case 2:
						optionsText += `epb_flags ${this.options[i].value.getUint32(0, this.le)}`;
						break;
					case 4:
						optionsText += `epb_dropcount ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 5:
						optionsText += `epb_packetid ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 6:
						optionsText += `epb_queue ${this.options[i].value.getUint32(0, this.le)}`;
						break;

					default:
						optionsText += `opt_unknown ${this.options[i].code}`;
				}
			}
		}
		return `${this.timestamp}: ${this.data.toString}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			`*Enhanced Packet Block: ${this.originalLength} bytes on wire, ${this.capturedLength} bytes captured`,
			`Interface ID: ${this._header.interfaces[this.interfaceID].Name} (${this.interfaceID})`
		];

		return [arr, this.data.getProperties];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this.data.packet.byteLength; i++) {
			ret += this.data.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this.data.packet).replaceAll(/[\x00\W]/g, ".");

	}
}


export class PCAPNGSimplePacketBlock extends PCAPNGSection {
	data: GenericPacket;

	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv, header.le);
	
		this.data = Section.processPayload(header.interfaces[0].linkType, new DataView(dv.buffer, dv.byteOffset + 12, this.capturedLength));
	}

	get capturedLength() {
		return this.blockLength-16;
	}

	get originalLength() {
		return this._packet.getUint32(8, this.le);
	}

	get optionStartOffset():number {
		return -1;
	}
	
	get options() {
		return [];
	}

	get toString() {
		return `${this.data.toString}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [
			`*Simple Packet Block: ${this.originalLength} bytes on wire, ${this.capturedLength} bytes captured`,
			`Interface ID: 0`
		];

		return [arr, this.data.getProperties];
	}

	get getHex(): string {
		let ret = "";
		for (let i = 0; i < this.data.packet.byteLength; i++) {
			ret += this.data.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get getASCII(): string {
		const decoder = new TextDecoder('ascii');
		return decoder.decode(this.data.packet).replaceAll(/[\x00\W]/g, ".");

	}
}


class PCAPNGInterfaceStatisticsBlock extends PCAPNGSection {
	constructor(dv: DataView, header: PCAPNGSectionHeaderBlock) {
		super(dv, header.le);
	}

	get interfaceID() {
		return this._packet.getUint32(8, this.le);
	}

	get tsHigh() {
		return this._packet.getUint32(12, this.le);
	}

	get tsLow() {
		return this._packet.getUint32(16, this.le);
	}

	get optionStartOffset():number { return 20; };

	get toString() {
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						optionsText += `opt_comment ${decoder.decode(this.options[i].value)}`;
						break;
					case 2:
						optionsText += `isb_starttime ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 3:
						optionsText += `isb_endtime ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 4:
						optionsText += `isb_ifrecv ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 5:
						optionsText += `isb_ifdrop ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 6:
						optionsText += `isb_filteraccept ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 7:
						optionsText += `isb_osdrop ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					case 8:
						optionsText += `isb_usrdeliv ${this.options[i].value.getBigUint64(0, this.le)}`;
						break;
					default:
						optionsText += `opt_unknown ${this.options[i].code}`;
				}
			}
		}
		return `interface ID:${this.interfaceID}${this.options !== undefined && this.options.length ? ", options: " + optionsText : ""}`;
	}
}

export class PCAPNGSectionHeaderBlock extends PCAPNGSection {
	public interfaceCount: number = 0;
	public interfaces: PCAPNGInterfaceDescriptionBlock[] = [];

	constructor(dv: DataView) {
		super(dv, true);
		this._le = this._packet.getUint32(8, true) === 0x1A2B3C4D;
	}

	get fileType() {
		return 2;
	}

	get optionStartOffset():number { return 24; };

	get toString() {
		
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			if (this.options.length > 0) {
				optionsText = ": ";
			}

			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 2:
					case 3:
					case 4:
						optionsText += `${decoder.decode(this.options[i].value)}; `;
					default:
						break;
				}
			}
		}

		return `Section Header${optionsText.substring(0, optionsText.length-2)}`;
	}
	
	get getProperties(): Array<any> {
		const arr: Array<any> = [
			"*Section Header Block"
		];
		let optionsText = "";
		const decoder = new TextDecoder('utf-8');
		if(this.options !== undefined) {
			for(let i = 0; i < this.options?.length; i++) {
				switch(this.options[i].code) {
					case 1:
						arr.push(`Comment: ${decoder.decode(this.options[i].value)}`);
						break;
					case 2:
						arr.push(`Hardware: ${decoder.decode(this.options[i].value)}`);
						break;
					case 3:
						arr.push(`OS: ${decoder.decode(this.options[i].value)}`);
						break;
					case 4:
						arr.push(`User Application: ${decoder.decode(this.options[i].value)}`);
						break;
					default:
						arr.push(`Option ${this.options[i].code}: Unknown`);
				}
			}
		}
		return [arr];
	}
	

}
