import { LargeNumberLike } from "crypto";
import { GenericPacket } from "./genericPacket";

export class DHCPPacket extends GenericPacket {
    packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

	get op() {
		return this.packet.getUint8(0);
	}

	get htype() {
		return this.packet.getUint8(1);
	}

    get hlen() {
		return this.packet.getUint8(2);
	}

    get hops() {
		return this.packet.getUint8(3);
	}

    get secs() {
		return this.packet.getUint16(8);
	}

    get flags() {
		return this.packet.getUint16(10);
	}

    get ciaddr() {
		return this.packet.getUint32(12);
	}
    
    get yiaddr() {
		return this.packet.getUint32(16);
	}

    get siaddr() {
		return this.packet.getUint32(20);
	}

    get giaddr() {
		return this.packet.getUint32(24);
	}

    get chaddr() {
		let ret = "";
        for(let i = 0; i < this.hlen; i++) {
            ret += this.packet.getUint8(28 + i).toString(16).padStart(2, "0");
            if(i != this.hlen-1) {
                ret += ":";
            }
        }
        return ret;
	}

	get sname() {
		const decoder = new TextDecoder(`utf-8`);
		const sname = decoder.decode(new DataView(this.packet.buffer, this.packet.byteOffset + 44, 64)).split(`\0`)[0];
		console.log(`[${sname}]`);
		return sname;
	}

	get options(): DHCPOption[] {
		if(this.packet.byteLength <= 240) {
			return [];
		}
		let i = this.packet.byteOffset + 240;
		const options: DHCPOption[] = [];
		try {
			do {
				const option = DHCPOption.create(new DataView(this.packet.buffer, i, this.packet.buffer.byteLength - i));
				if(option.length > 0) {
					i += option.length + 2;
					options.push(option);
				} else {
					i += 1;
					
				}
				
			} while(true);
		} catch(e) {
			
		} 
		return options;
	}
	
	get toString() {
		let optionsText: string = "";
		this.options.forEach(item => {optionsText += item.toString + " "});
		optionsText = optionsText.trimEnd();

		return `DHCP: chaddr: ${this.chaddr}${this.sname.length ? ", sname: " + optionsText : ""}${this.options.length ? " options: " + optionsText : ""}`;
	}

	
}

class DHCPOption {
	optionData: DataView = {} as DataView;
	length: number;
	code: number;

	constructor(dv: DataView, offset: number, length: number, code: number) {
		if(length == 0) {
			this.optionData = dv;
		} else {
			this.optionData = new DataView(dv.buffer, offset, length);
		}
		this.length = length;
		this.code = code;

	}

	static create(dv: DataView): DHCPOption {
		switch(dv.getUint8(0)) {
			case 0:
				return new DHCPOption(dv, 0, 0, 0);
			case 12:
				return new DHCPOptionHostName(dv, dv.byteOffset + 2, dv.getUint8(1), 12);
			case 50:
				return new DHCPOptionRequestedAddress(dv, dv.byteOffset + 2, 4, 50);
			case 51:
				return new DHCPOptionIPLeaseTime(dv, dv.byteOffset + 2, 4, 51);
			case 53:
				return new DHCPOptionMessageType(dv, dv.byteOffset + 2, 1, 53);
			case 54:
				return new DHCPOptionServerIdentifier(dv, dv.byteOffset + 2, 4, 54);
			case 58:
				return new DHCPOptionT1(dv, dv.byteOffset + 2, 4, 58);
			case 59:
				return new DHCPOptionT2(dv, dv.byteOffset + 2, 4, 59);
			case 255:
				throw "end";
			default:
				return new DHCPOption(dv, dv.byteOffset+2, dv.getUint8(1), dv.getUint8(0));

		}

	}


	get value(): string {
		let ret = "";
		for (let i = 0; i < this.optionData.byteLength; i++) {
			ret += this.optionData.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
	}

	get toString(): string {
		return `${this.code}: ${this.value}`;
	}





}

class DHCPOptionMessageType extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		switch(this.optionData.getUint8(0)) {
			case 1: 
				return "DHCPDISCOVER";
			case 2: 
				return "DHCPOFFER";
			case 3: 
				return "DHCPREQUEST";
			case 4: 
				return "DHCPDECLINE";
			case 5: 
				return "DHCPACK";
			case 6: 
				return "DHCPNAK";
			case 7: 
				return "DHCPRELEASE";
			default:
				return "";
		}
	}

	get toString(): string {
		return this.value;
	}


}

class DHCPOptionServerIdentifier extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		let ret = "";
		for(let i = 0; i < 4; i++) {
			ret += this.optionData.getUint8(i);
			if(i == 3) {
				break;
			}
			ret += "."
		}
		return ret;

	}

	get toString(): string {
		return `Server Address: ${this.value}`;
	}
}

class DHCPOptionRequestedAddress extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		let ret = "";
		for(let i = 0; i < 4; i++) {
			ret += this.optionData.getUint8(i);
			if(i == 3) {
				break;
			}
			ret += "."
		}
		return ret;

	}

	get toString(): string {
		return `Requested Address: ${this.value}`;
	}
}

class DHCPOptionIPLeaseTime extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		return this.optionData.getUint32(0).toString();

	}

	get toString(): string {
		return `IP Address Lease Time (s): ${this.value}`;
	}
}

class DHCPOptionT1 extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		return this.optionData.getUint32(0).toString();

	}

	get toString(): string {
		return `Renewal Time (s): ${this.value}`;
	}
}

class DHCPOptionT2 extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		return this.optionData.getUint32(0).toString();

	}

	get toString(): string {
		return `Rebinding Time (s): ${this.value}`;
	}
}

class DHCPOptionHostName extends DHCPOption {
	constructor(dv: DataView, offset: number, length: number, code: number) {
		super(dv, offset, length, code);

	}

	get value(): string {
		return new TextDecoder(`utf-8`).decode(this.optionData);

	}

	get toString(): string {
		return `Host Name: ${this.value}`;
	}
}
