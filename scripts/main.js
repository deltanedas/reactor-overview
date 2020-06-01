if (!this.global.reactorOverview) {
	this.global.reactorOverview = true;

	// array of int-packed positions
	const reactors = [];
	var frag;

	const suffices = ['K', 'M', 'B', 'T'];

	const suffix = n => {
		var thresh;
		for (var i = suffices.length - 1; i > 0; i--) {
			thresh = Math.pow(10, i * 3);
			print([n, i, thresh]);
			if (n >= thresh) {
				return Math.round(n / thresh * 10) / 10 + suffices[i - 1];
			}
		}
		return Math.round(n);
	};

	Events.on(EventType.ClientLoadEvent, run(e => {
		frag = extend(Fragment, {
			build(parent) {
				parent.fill(cons(cont => {
					cont.visible(boolp(() => this.visible));
					cont.update(run(() => {
						if (Vars.state.is(State.menu)) {
							this.visible = false;
							return;
						}
					}));
					cont.table(Tex.buttonTrans, cons(pane => {
						pane.label(prov(() => "Reactors"));
						pane.row();
						pane.pane(this.content).grow().get().setScrollingDisabled(true, false);
						pane.row();

						// Add reactor player is over
						pane.addImageButton(Icon.upgrade, Styles.clearPartiali, 32, run(() => this.set()));
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
				if (!(reactor.block() instanceof NuclearReactor)) {
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
				var icon = new TextureRegionDrawable(reactor.block().icon(Cicon.full));
				table.margin(8);
				table.label(safe(() => reactor.x + "," + reactor.y));
				table.label(safe(() => " | F " + reactor.entity.items.total()));
				table.label(safe(() => " | C " + Math.round(reactor.entity.liquids.total())));
				table.label(safe(() => " | H " + Math.round(reactor.entity.heat * 100) + "%"));
				table.label(safe(() => " | P " + suffix(reactor.block().getPowerProduction(reactor) * 60 * reactor.entity.timeScale)));
				this.content.add(table).padBottom(3);
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

		const table = new Table();
		table.setFillParent(true);

		const icon = new TextureRegionDrawable(Blocks.thoriumReactor.icon(Cicon.full));
		table.addImageButton(icon, Styles.clearPartiali, 48, run(() => {
			frag.toggle();
		}));

		table.visible(boolp(() => Vars.state.state != State.menu));
		table.defaults().width(100).height(50);
		table.margin(4).top().left();
		table.marginLeft(240);

		Core.scene.add(table);
	}));
}
