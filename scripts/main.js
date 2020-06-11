var ui = require("ui-lib/library");

// array of int-packed positions
const reactors = [];
// fragment that houses the reactor info TODO: add fragment creation to ui-lib
var frag;

const suffices = ['K', 'M', 'B', 'T'];

function suffix(n) {
	var thresh;
	for (var i = suffices.length - 1; i > 0; i--) {
		thresh = Math.pow(10, i * 3);
		if (n >= thresh) {
			return Math.round(n / thresh * 10) / 10 + suffices[i - 1];
		}
	}
	return Math.round(n);
}

ui.once(null, () => {
	frag = extend(Fragment, {
		build(parent) {
			this.content.touchable(Touchable.childrenOnly);

			parent.fill(cons(cont => {
				cont.visible(boolp(() => this.visible));
				cont.touchable(Touchable.childrenOnly);
				cont.update(run(() => {
					if (Vars.state.is(GameState.State.menu)) {
						this.visible = false;
						return;
					}
				}));
				cont.table(Tex.buttonTrans, cons(pane => {
					pane.label(prov(() => "Reactors")).get().touchable(Touchable.disabled);
					pane.row();
					pane.pane(this.content).grow()
						.touchable(Touchable.childrenOnly)
						.get().setScrollingDisabled(true, false);
					pane.row();

					// Add reactor player is above
					pane.addImageButton(Icon.upgrade, Styles.clearPartiali, 32, run(() => this.set())).margin(8);
				}));
				cont.bottom();
			}));
			this.rebuild();
		},

		toggle() {
			this.visible = !this.visible;
		},

		rebuild() {
			this.content.clear();

			for (var i in reactors) {
				this.add(i);
			}
		},

		add(i) {
			var reactor = Vars.world.tile(reactors[i]);
			if (!reactor || !(reactor.block() instanceof NuclearReactor)) {
				return;
			}

			const safe = func => prov(() => {
				if (!reactor.entity || !reactor.entity.items) {
					reactors.splice(i, 1);
					this.rebuild();
					return "";
				}
				return func();
			});

			var table = new Table();
			table.margin(2).touchable(Touchable.childrenOnly);
			table.label(safe(() => reactor.x + "," + reactor.y
				+ " | F " + suffix(reactor.entity.items.total())
				+ " | C " + Math.round(reactor.entity.liquids.total())
				+ " | H " + Math.round(reactor.entity.heat * 100) + "%"
				+ " | P " + suffix(reactor.block().getPowerProduction(reactor) * 60 * reactor.entity.timeScale))).touchable(Touchable.disabled);
			// SCRAM button
			table.addImageButton(Icon.cancel, Styles.clearPartiali, run(() => {
				// Take out 300
				for (var i = 0; i < 20; i++) {
					// 15 at a time, smallest inventory fits this
					Call.requestItem(Vars.player, reactor, Items.thorium, 15);
				}
			})).margin(4).visible(boolp(() => {
				// Only show when reactor is low on cryo
				return reactor.entity != null && reactor.entity.liquids.total() < 28;
			}));;
			this.content.add(table);
			this.content.row();
		},

		set() {
			const tile = Vars.world.tile(Vars.player.x / Vars.tilesize, Vars.player.y / Vars.tilesize);
			const pos = this.reactorCenter(tile, false);
			if (pos !== null) {
				const index = reactors.indexOf(pos);
				if (index >= 0) {
					reactors.splice(index, 1);
					Vars.ui.showInfoToast("Removed reactor", 5);
				} else {
					reactors.push(pos);
					Vars.ui.showInfoToast("Added reactor", 5);
				}
				this.rebuild();
			} else {
				Vars.ui.showInfoToast("Not above a reactor.", 5);
			}
		},

		reactorCenter(tile, tried) {
			const block = tile.block();
			if (!block) return null;
			if (block instanceof BlockPart) {
				return tried ? null : this.reactorCenter(block.linked(tile), true);
			}
			return block instanceof NuclearReactor ? tile.pos() : null;
		}
	});
	frag.visible = false;
	frag.content = new Table().marginLeft(10).marginRight(10);
	frag.build(Vars.ui.hudGroup);

	// Only hook event to rebuild once
	Events.on(EventType.WorldLoadEvent, run(() => {
		frag.rebuild();
	}));
});

ui.addButton("reactor-overview", Blocks.thoriumReactor, button => {
	frag.toggle();
}, button => {
	// don't fill the button with the icon
	button.get().resizeImage(47.2 - 8);
});
