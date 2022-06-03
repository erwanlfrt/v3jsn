import { sn } from './SpatialNavigation';
import "focus-options-polyfill";
import "scroll-behavior-polyfill";
import { Configuration, defaultConfiguration } from './types/Configuration';
import { App, Directive } from '@vue/runtime-core';

const vueSpatialNavigation = {
  install(app: App, config: Configuration) {
    const globalConfig = defaultConfiguration;
    Object.assign(globalConfig, config);
    sn.init();
    sn.set(undefined, globalConfig as Configuration);
    app.provide('$SpatialNavigation', sn);

    const assignConfig = (sectionId: string | undefined, config: Configuration): Configuration => {
      let sectionConfig = Object.assign({}, globalConfig) as Configuration;
      if (config) {
        Object.assign(sectionConfig, config);
      }
      sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
      return sectionConfig;
    };

    const focusSectionDirective: Directive<any,any> = {
      beforeMount (element: HTMLElement, binding) {
        let sectionId = null;
        console.log('binding.value = ', binding.value);
        if (binding.value && binding.value.id && binding.value.conf) {
          sectionId = binding.value.id;
          const config = binding.value.conf as Configuration;
          try {
            sn.add(sectionId, config);
          } catch (error) {}
        } else {
          sectionId = sn.add(undefined, defaultConfiguration);
        }

        // set sectionid to data set for removing when unbinding
        element.dataset.sectionId = sectionId;
        sn.set(sectionId, assignConfig(sectionId, binding.value.conf));
        // set default section
        if (binding.modifiers.default) {
          sn.setDefaultSection(sectionId);
        }
      },
      mounted (element: HTMLElement, binding) {
        let sectionId = element.dataset.sectionId;
        if (binding.arg && sectionId != binding.arg) {
          sectionId = binding.arg;
          element.dataset.sectionId = sectionId;
        }
        // if (binding.value) {
        //   try {
        //     sn.set(sectionId, binding.value);
        //   } catch (error) {
        //     sn.add(sectionId, assignConfig(sectionId, binding.value));
        //   }
        // }
      },
      unmounted (element: HTMLElement) {
        if (element.dataset.sectionId) {
          sn.remove(element.dataset.sectionId);
        }
      }
    }

    // focus section directive
    app.directive("focus-section", focusSectionDirective);

    const disableSection = (sectionId: string, disable: boolean): void => {
      if (disable == false) {
        sn.enable(sectionId);
      } else {
        sn.disable(sectionId);
      }
    };

    // diasble focus section directive
    app.directive("disable-focus-section", {
      beforeMount (el, binding) {
        disableSection(el.dataset.sectionId, binding.value);
      },
      mounted (el, binding) {
        disableSection(el.dataset.sectionId, binding.value);
      }
    });

    const disableElement = (element: HTMLElement, focusable: any) => {
      focusable = focusable == false ? false : true;
      if (!element.dataset.focusable || element.dataset.focusable != focusable + "") {
        element.dataset.focusable = focusable;
        if (focusable) element.tabIndex = -1;
      }
    };
    // focusable directive
    app.directive("focus", {
      beforeMount (el, binding) {
        disableElement(el, binding.value);
      },
      mounted (el, binding) {
        disableElement(el, binding.value);
      },
      unmounted (el) {
        el.removeAttribute("data-focusable");
      }
    });
  }
};

export default vueSpatialNavigation;
