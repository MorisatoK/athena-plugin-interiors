import * as alt from 'alt-server';
import { INTERIOR_SYSTEM } from '../../shared/flags';
import { Interior } from '../../shared/interfaces';
import { PERMISSIONS } from '@AthenaShared/flags/permissionFlags';
import { InputMenu, InputOptionType, InputResult } from '@AthenaShared/interfaces/inputMenus';
import { InteriorSystem } from './system';
import { Athena } from '@AthenaServer/api/athena';

Athena.controllers.chat.addCommand('addhouse', '/addhouse', PERMISSIONS.ADMIN, addhouse);

async function addhouse(player: alt.Player) {
    const menu: InputMenu = {
        title: 'Create House (Unchecked. Do it right.)',
        options: [
            {
                id: 'name',
                desc: 'Name of Property',
                placeholder: 'Property Name',
                type: InputOptionType.TEXT,
                error: 'Must specify property name.',
            },
            {
                id: 'price',
                desc: 'Price of Property',
                placeholder: '5000...',
                type: InputOptionType.NUMBER,
                error: 'Must specify property value.',
            },
            {
                id: 'interior',
                desc: 'Position of Property Interior. As JSON String.',
                placeholder: '{ "x": 0, "y": 0, "z": 0 }',
                type: InputOptionType.TEXT,
                error: 'Must specify property position.',
            },
            {
                id: 'ipl',
                desc: 'Optional IPL to load on enter if necessary.',
                placeholder: 'Google it.',
                type: InputOptionType.TEXT,
            },
        ],
        serverEvent: 'cmd:Create:House',
    };

    Athena.player.emit.inputMenu(player, menu);
}

alt.onClient('cmd:Create:House', async (player: alt.Player, results: InputResult[]) => {
    if (!results) {
        return;
    }

    if (!player.accountData) {
        return;
    }

    if (!Athena.utility.isFlagEnabled(player.accountData.permissionLevel, PERMISSIONS.ADMIN)) {
        return;
    }

    const [name, price, interior, ipl] = results;

    if (!name || !price || !interior) {
        Athena.player.emit.message(player, `Please make sure all fields are valid.`);
        return;
    }

    if (!name.value || !price.value || !interior.value) {
        Athena.player.emit.message(player, `Please make sure all fields are valid.`);
        return;
    }

    let actualPos: alt.IVector3;

    try {
        actualPos = JSON.parse(interior.value);
    } catch (err) {
        Athena.player.emit.message(player, `Not a valid Vector3 JSON`);
        return;
    }

    if (!actualPos) {
        Athena.player.emit.message(player, `Not a valid Vector3 JSON`);
        return;
    }

    const houseData: Interior = {
        name: name.value,
        outside: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
        inside: actualPos,
        objects: [],
        price: parseInt(price.value),
        isUnlocked: true,
        system:
            INTERIOR_SYSTEM.HAS_LOCK |
            INTERIOR_SYSTEM.HAS_OWNER |
            INTERIOR_SYSTEM.HAS_PRICE |
            INTERIOR_SYSTEM.HAS_STORAGE,
    };

    if (ipl && ipl.value) {
        houseData.ipl = ipl.value;
    }

    await InteriorSystem.add(houseData);
    Athena.player.emit.message(player, `Created House`);
});
