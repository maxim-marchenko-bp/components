/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  Type,
} from '@angular/core';

/** Apps in which we've loaded styles. */
const appsWithLoaders = new WeakMap<
  ApplicationRef,
  {
    /** Style loaders that have been added. */
    loaders: Set<Type<unknown>>;

    /** References to the instantiated loaders. */
    refs: ComponentRef<unknown>[];
  }
>();

/**
 * Service that loads structural styles dynamically
 * and ensures that they're only loaded once per app.
 */
@Injectable({providedIn: 'root'})
export class _CdkPrivateStyleLoader {
  private _appRef = inject(ApplicationRef);
  private _environmentInjector = inject(EnvironmentInjector);

  /**
   * Loads a set of styles.
   * @param loader Component which will be instantiated to load the styles.
   */
  load(loader: Type<unknown>): void {
    let data = appsWithLoaders.get(this._appRef);

    // If we haven't loaded for this app before, we have to initialize it.
    if (!data) {
      data = {loaders: new Set(), refs: []};
      appsWithLoaders.set(this._appRef, data);

      // When the app is destroyed, we need to clean up all the related loaders.
      this._appRef.onDestroy(() => {
        appsWithLoaders.get(this._appRef)?.refs.forEach(ref => ref.destroy());
        appsWithLoaders.delete(this._appRef);
      });
    }

    // If the loader hasn't been loaded before, we need to instatiate it.
    if (!data.loaders.has(loader)) {
      data.loaders.add(loader);
      data.refs.push(createComponent(loader, {environmentInjector: this._environmentInjector}));
    }
  }
}
